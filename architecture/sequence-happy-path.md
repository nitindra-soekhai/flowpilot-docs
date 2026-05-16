# Sequence Diagram — Happy Path

> Full vendor onboarding workflow from request submission to approval. Every step observable via trace ID.

```mermaid
sequenceDiagram
    autonumber
    actor PM as Procurement Manager
    participant API as Vendor Onboarding API
    participant MW as Trace Middleware
    participant RBAC as RBAC Dependency
    participant Graph as LangGraph Graph
    participant RAG as RAG Service
    participant Qdrant as Qdrant
    participant OpenAI as OpenAI API
    participant DB as SQLite

    PM->>MW: POST /workflows/ {vendor_name, documents...}
    MW->>MW: Generate X-Trace-ID = uuid4()
    MW->>RBAC: Validate JWT — procurement_manager role
    RBAC->>DB: Write audit_log row (granted)
    RBAC->>API: user = {sub: sarah.chen, role: procurement_manager}

    API->>Graph: graph.astream(initial_state, config)

    Note over Graph: Node 1 — initiate_node
    Graph->>RAG: POST /query {query: "cloud vendor requirements"}<br/>X-Trace-ID: [same trace_id]
    RAG->>Qdrant: Hybrid vector search (dense + sparse)
    Qdrant-->>RAG: Top-k chunks with scores
    RAG->>RAG: confidence_check(scores) — passes (score ≥ 0.65)
    RAG->>OpenAI: Ground chunks in LLM response
    OpenAI-->>RAG: Policy guidance text
    RAG->>RAG: guardrails_check() — citation found, passes
    RAG-->>Graph: Policy guidance (HTTP 200)
    Graph->>DB: create_workflow() — state=INITIATED

    Note over Graph: Node 2 — collect_documents_node
    Graph->>Graph: Validate submitted documents vs required list
    Graph->>DB: update_workflow(DOCUMENTS_COLLECTED) + add_event()

    Note over Graph: Node 3 — security_review_node
    Graph->>RAG: POST /query {query: "security requirements cloud vendors"}
    RAG-->>Graph: Security policy guidance
    Graph->>Graph: Generate mock security findings
    Graph->>DB: update_workflow(SECURITY_REVIEW, findings=[...])

    Note over Graph: Node 4 — pending_approval_node (HITL gate)
    Graph->>DB: update_workflow(PENDING_APPROVAL) + add_event(ROUTED_FOR_APPROVAL)
    Graph-->>API: Graph ends — workflow in PENDING_APPROVAL

    API-->>PM: 201 {workflow_id, state: PENDING_APPROVAL, next_actions: [...]}

    Note over PM: Workflow is visible to security approver

    actor SA as Security Approver
    SA->>MW: POST /workflows/{id}/decisions {decision: approved, reason: ...}
    MW->>MW: Same or new X-Trace-ID
    RBAC->>RBAC: Validate JWT — security_approver role required
    RBAC->>DB: Write audit_log row (granted)

    API->>API: State guard — must be PENDING_APPROVAL
    API->>Graph: finalize_node(state + decision)
    Graph->>DB: update_workflow(APPROVED, approver=michael.davidson)
    Graph->>DB: add_event(WORKFLOW_APPROVED)

    API-->>SA: 200 {state: APPROVED, approver: michael.davidson, ...}
```

---

## Observable artefacts at each step

| Step | What is logged | Where |
|------|---------------|-------|
| Request arrival | `trace_id`, `user`, `role`, `path` | structlog stdout |
| RBAC check | `permission`, `outcome`, `role` | audit_log table |
| RAG retrieval | `query`, `top_score`, `latency_ms`, `confidence_passed` | rag audit_log |
| LLM call | `tokens_in`, `tokens_out`, `model`, `latency_ms` | rag audit_log |
| Guardrails | `matched_pattern`, `blocked` | structlog stdout |
| Node transition | `node`, `current_state`, `trace_id` | structlog stdout |
| Workflow state change | `workflow_id`, `state`, `updated_at` | workflows table |
| Approval decision | `approver`, `decision`, `reason` | workflow_events |

**Full audit trail reconstruction:** given any `workflow_id`, join `workflows` + `workflow_events` + `audit_log` on `trace_id` to reconstruct the complete AI decision chain — what was retrieved, what the LLM said, what the human decided, in chronological order.
