# Sequence Diagrams — Failure Paths

Two failure scenarios: RAG service unavailable (degraded mode) and retry exhaustion leading to dead-letter.

---

## Failure Path 1 — RAG Service Unavailable (Degraded Mode)

> When the RAG service returns 503 or times out, the workflow activates degraded mode: a structured questionnaire replaces AI guidance. Every log line carries `degraded=true`. The workflow still completes to PENDING_APPROVAL — no autonomous decisions are made in degraded mode.

```mermaid
sequenceDiagram
    autonumber
    actor PM as Procurement Manager
    participant API as Vendor Onboarding API
    participant Graph as LangGraph Graph
    participant RAG as RAG Service
    participant DB as SQLite

    PM->>API: POST /workflows/ {vendor_name, documents...}
    API->>Graph: graph.astream(initial_state)

    Note over Graph: Node 1 — initiate_node

    Graph->>RAG: POST /query (attempt 1)
    RAG-->>Graph: HTTP 503 Service Unavailable
    Note over Graph: retry.attempt — delay 0.5s
    Graph->>RAG: POST /query (attempt 2)
    RAG-->>Graph: HTTP 503
    Note over Graph: retry.attempt — delay 1.0s
    Graph->>RAG: POST /query (attempt 3)
    RAG-->>Graph: HTTP 503

    Note over Graph: DegradedModeError raised<br/>degraded=True activated
    Graph->>Graph: guidance = DEGRADED_QUESTIONNAIRE (7 structured questions)
    Graph->>DB: create_workflow(policy_guidance=questionnaire, degraded=1)

    Note over Graph: Node 2, 3 — continue in degraded mode
    Graph->>Graph: degraded=True logged on every line
    Graph->>DB: update_workflow(SECURITY_REVIEW)<br/>finding: "DEGRADED MODE — manual verification required"

    Note over Graph: Node 4 — pending_approval_node
    Graph->>DB: update_workflow(PENDING_APPROVAL)

    API-->>PM: 201 {state: PENDING_APPROVAL, degraded: true,<br/>policy_guidance: "...questionnaire...", next_actions: [...]}

    Note over PM: Approver sees degraded=true flag in response.<br/>Manual verification required before approving.
```

**What the approver sees:** The workflow response includes `"degraded": true`. The security findings include an explicit finding: *"DEGRADED MODE: Security review based on questionnaire — manual verification required when RAG service is restored."* The approver is expected to manually verify before approving.

**What is logged:** Every structlog line from initiate_node onward carries `degraded=True`. The three retry attempts are logged with attempt number, delay, and error reason. The DegradedModeError activation is a WARNING log line.

---

## Failure Path 2 — Retry Exhaustion → Dead Letter

> When a non-503 failure exhausts all retry attempts (e.g. network partition, unexpected error), the step is dead-lettered and the workflow is set to FAILED. No silent data loss.

```mermaid
sequenceDiagram
    autonumber
    actor PM as Procurement Manager
    participant API as Vendor Onboarding API
    participant Graph as LangGraph Graph
    participant RAG as RAG Service
    participant DB as SQLite
    actor Admin as Platform Admin

    PM->>API: POST /workflows/ {vendor_name, documents...}
    API->>Graph: graph.astream(initial_state)

    Note over Graph: Node 1 — initiate_node
    Graph->>DB: create_workflow(state=INITIATED)

    Note over Graph: Node 3 — security_review_node
    Graph->>RAG: POST /query (attempt 1)
    RAG-->>Graph: ConnectionError — network partition
    Note over Graph: retry.attempt — delay 0.5s
    Graph->>RAG: POST /query (attempt 2)
    RAG-->>Graph: ConnectionError
    Note over Graph: retry.attempt — delay 1.0s
    Graph->>RAG: POST /query (attempt 3)
    RAG-->>Graph: ConnectionError

    Note over Graph: retry.exhausted — max_attempts=3 reached
    Graph->>DB: write_dead_letter(step_name=security_review_node,<br/>workflow_id=..., payload={query}, error=ConnectionError, trace_id=...)
    Graph->>DB: update_workflow(state=FAILED)

    API-->>PM: 500 {detail: "Orchestration error: ConnectionError"}

    Note over Admin: Dead-letter table is now depth=1<br/>If depth > 5 → alert.dead_letter_depth_high WARNING emitted

    Admin->>DB: SELECT * FROM dead_letter WHERE workflow_id=...
    Note over Admin: Full context: step_name, payload_json,<br/>error_message, trace_id, timestamp
    Admin->>API: Resubmit workflow after service recovery
```

**Dead-letter record contains:**
- `service` — flowpilot-vendor-onboarding
- `step_name` — security_review_node
- `workflow_id` — UUID of the failed workflow
- `payload_json` — the RAG query that failed
- `error_message` — full exception string
- `trace_id` — links to all log lines from that request
- `timestamp` — when the failure was recorded

**Alerting:** When `dead_letter` depth exceeds 5, `alert.dead_letter_depth_high` WARNING is emitted by `app/utils/alerting.py`. This is consumed by log aggregator alert rules (Grafana/ELK) — no metrics server required.
