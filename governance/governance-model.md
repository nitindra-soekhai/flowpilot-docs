# Governance Model

> How FlowPilot enforces AI action boundaries, preserves human approval authority, and maintains full auditability. This document is written for compliance reviewers and governance boards, not just architects.

---

## Governing Principle

**AI may recommend. Humans decide.**

Every AI output in FlowPilot is a recommendation or guidance — never an autonomous decision with system-of-record impact. The governance model is enforced structurally (through code and architecture) rather than through policy documents that rely on human compliance.

---

## AI Action Boundaries

### What AI may do

| Action | How it is bounded |
|--------|------------------|
| Retrieve policy documents | Scoped to documents in the knowledge base. Cannot access documents outside the Qdrant collection. |
| Generate policy guidance | Must cite retrieved source material. Uncited responses are blocked by the guardrails layer before reaching the caller. |
| Assess vendor documents | Produces findings — does not make pass/fail decisions. All findings are advisory. |
| Route for approval | Moves workflow to PENDING_APPROVAL state. Does not approve. |
| Recommend next actions | Surfaces `next_actions` in API response. These are informational only. |

### What AI may never do

| Action | Enforcement mechanism |
|--------|----------------------|
| Approve a vendor onboarding workflow | The `security_approver` role is required for `POST /decisions`. The agent does not hold this role. Structurally impossible. |
| Create a vendor record in a system of record | No tool or API call exists in the agent for this action. Agent scope is bounded by available tools. |
| Grant data access | Not in agent scope. Human confirmation required before any privileged action. |
| Continue with low-confidence retrieval | Confidence threshold check blocks LLM call when `top_score < 0.65`. Agent surfaces `low_confidence: true` to caller. |
| Return uncited guidance | Guardrails layer validates citation before response leaves the RAG service. Response blocked if no source reference found. |

---

## HITL Enforcement

The human-in-the-loop gate is enforced through three independent mechanisms. All three must be bypassed simultaneously to approve a workflow without a human — this is structurally impossible with the current architecture.

### Mechanism 1 — RBAC
The `POST /workflows/{id}/decisions` endpoint requires the `security_approver` role in the JWT. The `procurement_manager` role (which creates workflows) does not have the `workflows:approve` permission. An agent acting on behalf of a `procurement_manager` inherits only that user's permissions — it cannot self-approve.

```python
# From app/middleware/rbac.py
ROLE_PERMISSIONS = {
    "procurement_manager": ["workflows:create", "workflows:read", "workflows:policy"],
    "security_approver":   ["workflows:read", "workflows:approve", "workflows:reject", "workflows:policy"],
}
```

### Mechanism 2 — State Guard
Even if a caller with `security_approver` role calls the decisions endpoint, the router enforces a state check:

```python
if row["current_state"] != "PENDING_APPROVAL":
    raise HTTPException(409, "Decisions can only be made on PENDING_APPROVAL workflows")
```

A workflow that has not been through the full pipeline (initiate → security_review → pending_approval) cannot be decided.

### Mechanism 3 — Audit Trail
Every decision is written to the `workflow_events` table with `actor` (the approver's JWT `sub`), `decision`, `reason`, and `timestamp`. Every API call that reaches the decisions endpoint is written to `audit_log` with `user_id`, `role`, and `outcome`. An approval decision without an audit row is a system error — not a silent gap.

---

## Auditability

### What is always logged

| Event | Where | Fields |
|-------|-------|--------|
| Every API request | `audit_log` table | `trace_id`, `user_id`, `role`, `action`, `resource`, `outcome`, `timestamp` |
| Every workflow state change | `workflow_events` table | `workflow_id`, `event_type`, `actor`, `payload`, `timestamp`, `trace_id` |
| Every RAG retrieval | RAG `audit_log` | `query`, `strategy`, `top_k_scores`, `latency_ms`, `confidence_passed`, `trace_id` |
| Every LLM call | RAG `audit_log` | `tokens_in`, `tokens_out`, `model`, `latency_ms`, `trace_id` |
| Every retry attempt | structlog stdout | `step`, `attempt`, `delay_s`, `error`, `trace_id` |
| Every dead-letter write | `dead_letter` table | `step_name`, `workflow_id`, `payload_json`, `error_message`, `trace_id` |
| Degraded mode activation | structlog stdout | `degraded=True` on every line while in fallback |

### Full audit trail reconstruction

Given any workflow approval decision, an auditor can reconstruct:

1. **Who requested it** — `workflows.requester` + `audit_log` entry for `POST /workflows/`
2. **What policy the AI retrieved** — RAG `audit_log` rows matching `trace_id`
3. **What the AI recommended** — `workflows.policy_guidance` + `workflow_events.SECURITY_REVIEW_COMPLETED`
4. **What the human decided** — `workflow_events.WORKFLOW_APPROVED/REJECTED` with `actor`, `reason`, `timestamp`
5. **The complete chain** — all records share `trace_id`, enabling JOIN across all four sources

```sql
-- Reconstruct complete audit trail for a workflow
SELECT 
    we.timestamp, we.event_type, we.actor, we.payload
FROM workflow_events we
WHERE we.workflow_id = '95038c25-c055-498e-b923-ecb26edcb7dd'
ORDER BY we.id;

-- Cross-service correlation via trace_id
SELECT al.timestamp, al.action, al.user_id, al.role, al.outcome
FROM audit_log al
WHERE al.trace_id = '9ffb3094-d61a-4a4f-89a0-07833fd9c667';
```

---

## Governance Gaps (Accepted, Documented)

These are known limitations of the portfolio implementation, documented for transparency.

| Gap | Production resolution |
|-----|----------------------|
| Mock mode does not call real LLM | Days 1-3 use mock responses. Day 4 switches to live OpenAI. Governance applies fully in live mode. |
| SQLite is single-node | Multi-instance deployments require PostgreSQL. See ADR-005. |
| No approval SLA enforcement | Approval timeout triggers a log warning. Production: Temporal activities with deadline callbacks. |
| No token-level audit | Token counts are logged but not alerting on per-user daily budgets. Production: Prometheus counter + Grafana alert. |
| MemorySaver not durable | LangGraph checkpoints lost on process restart. Production: AsyncSqliteSaver or AsyncPostgresSaver. |


---

## Portfolio Scope: Single-Step Approval vs Production Multi-Approver Design

### What the portfolio implements

The current implementation has a single approval step: a `security_approver` approves or rejects the entire vendor onboarding workflow. This is a deliberate scope simplification, not an architectural position.

### What the production design specifies

The FlowPilot functional specification defines five approval areas:

| Approver | Responsibility |
|----------|---------------|
| Procurement | Commercial terms, budget, vendor contract |
| Security | Security questionnaire, risk assessment, SOC 2 |
| Legal | DPA, contractual obligations, liability |
| Compliance | Regulatory alignment, data residency, GDPR |
| Operational | IT integration, access provisioning, SLA |

In the production design, each approval area is a sequential or parallel gate in the workflow. Each approver sees only the findings relevant to their domain. The workflow advances to the next gate only when the current gate is resolved.

### Why it was simplified for portfolio scope

A five-gate approval workflow requires five distinct JWT roles, five sets of endpoints, conditional routing logic between gates, and escalation paths per gate. Building and demonstrating all five in a 3-4 day portfolio sprint would leave no time for the observability, resilience, and governance depth that differentiate this portfolio.

The single-step implementation demonstrates the HITL pattern structurally and correctly. Extending it to five sequential gates is an additive change — the platform HITL interface (ADR-004), RBAC model, and state machine structure all support it without architectural changes.

### Production extension pattern

```python
# Current — single gate
WORKFLOW_STATES = [
    "INITIATED", "DOCUMENTS_COLLECTED", "SECURITY_REVIEW",
    "PENDING_APPROVAL",  # one gate
    "APPROVED", "REJECTED"
]

# Production — five sequential gates
WORKFLOW_STATES = [
    "INITIATED", "DOCUMENTS_COLLECTED",
    "SECURITY_REVIEW", "PENDING_SECURITY_APPROVAL",   # Gate 1
    "LEGAL_REVIEW",    "PENDING_LEGAL_APPROVAL",       # Gate 2
    "COMPLIANCE_CHECK","PENDING_COMPLIANCE_APPROVAL",  # Gate 3
    "PROCUREMENT_REVIEW","PENDING_PROCUREMENT_APPROVAL", # Gate 4
    "OPERATIONAL_REVIEW","PENDING_OPERATIONAL_APPROVAL", # Gate 5
    "APPROVED", "REJECTED", "TIMED_OUT"
]
```

Each gate adds a node pair (review + pending_approval) to the LangGraph state machine. The platform RBAC model extends by adding role-permission entries. No platform-level changes required.
