# Sequence Diagram — Approval Timeout

> What happens when a security_approver does not respond within the SLA window. The workflow cannot be left in PENDING_APPROVAL indefinitely — stakeholders must be notified and the state must be recoverable without data loss.

```mermaid
sequenceDiagram
    autonumber
    actor PM as Procurement Manager
    participant API as Vendor Onboarding API
    participant Graph as LangGraph Graph
    participant DB as SQLite
    participant Notify as Notification Service
    actor SA as Security Approver
    actor Admin as Platform Admin

    PM->>API: POST /workflows/ {vendor details...}
    API->>Graph: graph.astream(initial_state)
    Note over Graph: initiate → collect_documents → security_review → pending_approval
    Graph->>DB: update_workflow(state=PENDING_APPROVAL, created_at=T+0)
    API-->>PM: 201 {state: PENDING_APPROVAL}

    Note over DB: Approval SLA window: 72 hours<br/>Defined in workflow configuration

    rect rgb(255, 245, 230)
        Note over DB,Notify: T + 72 hours — SLA timeout reached
        DB->>DB: Scheduled check finds workflows WHERE<br/>state=PENDING_APPROVAL AND<br/>updated_at < NOW() - INTERVAL '72 hours'
        DB->>Notify: Emit timeout event for workflow_id
        Notify->>SA: Escalation notification — approval overdue
        Notify->>PM: Status update — approval pending escalation
        DB->>DB: add_event(APPROVAL_TIMEOUT_ESCALATED)
    end

    Note over SA: Approver may still decide after escalation

    alt Approver responds after escalation
        SA->>API: POST /workflows/{id}/decisions {decision: approved}
        API->>DB: update_workflow(state=APPROVED)
        API-->>SA: 200 {state: APPROVED}
        Note over DB: Workflow completes — timeout event remains in history
    else Approver does not respond — compensating action triggered
        rect rgb(255, 235, 235)
            Note over DB,Admin: T + 96 hours — compensating action
            DB->>DB: update_workflow(state=TIMED_OUT)
            DB->>DB: add_event(WORKFLOW_TIMED_OUT, compensating_action=revert)
            Note over DB: Provisional state reverted — no partial<br/>vendor registration persists
            Notify->>PM: Workflow timed out — resubmission required
            Notify->>Admin: Workflow flagged for manual review
        end

        Admin->>API: GET /workflows/{id}/events
        API-->>Admin: Full event trail including timeout and escalation events
        Note over Admin: Admin can reopen workflow or escalate<br/>to department head for exception approval
    end
```

---

## Timeout configuration

| SLA boundary | Duration | Action |
|-------------|----------|--------|
| Approval SLA | 72 hours | Escalation notification to approver and requester |
| Compensating action | 96 hours | Workflow state → TIMED_OUT, provisional state reverted |
| Manual review flag | On TIMED_OUT | Platform admin notified, workflow visible in review queue |

Timeout thresholds are defined in workflow configuration — not hardcoded. Different vendor types or access levels can carry different SLA windows (e.g. emergency onboarding: 4 hours; standard: 72 hours).

---

## What the audit log contains after a timeout

```sql
-- Events for a timed-out workflow
SELECT event_type, actor, timestamp, payload
FROM workflow_events
WHERE workflow_id = '<id>'
ORDER BY id;

-- Returns:
-- WORKFLOW_INITIATED        | sarah.chen       | T+0
-- DOCUMENTS_COLLECTED       | sarah.chen       | T+0
-- SECURITY_REVIEW_COMPLETED | system           | T+0
-- ROUTED_FOR_APPROVAL       | system           | T+0
-- APPROVAL_TIMEOUT_ESCALATED| system           | T+72h
-- WORKFLOW_TIMED_OUT        | system           | T+96h
```

A compliance auditor can reconstruct the full timeline: who submitted, when it was routed, when the SLA was breached, and what compensating action was taken.

---

## Production implementation note

The portfolio implementation (Days 1-3) does not include a background SLA scheduler. In production this would be implemented via:

- **Temporal activities with deadlines** — the approval step is a Temporal activity with a configurable deadline. On timeout, Temporal automatically routes to the compensating workflow.
- **Alternatively:** A scheduled job (cron or Celery Beat) that queries PENDING_APPROVAL workflows older than the SLA window and emits timeout events.

This is a documented gap (see [governance model](../governance/governance-model.md)) — not a hidden limitation.
