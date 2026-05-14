# Happy Path Sequence Diagram

Acme Cloud Services onboarding — trace_id: `fp-2026-a4b2`

```mermaid
sequenceDiagram
    actor Sarah as Sarah Chen
    participant VOB as vendor-onboarding
    participant RBAC as RBAC
    participant LG as LangGraph
    participant RAG as rag-service
    participant QDB as Qdrant
    participant OAI as OpenAI API
    participant SDB as SQLite · Audit
    actor Michael as Michael Davidson

    Note over Sarah,Michael: trace_id: fp-2026-a4b2

    Sarah->>VOB: POST /assessments · vendor=Acme Cloud Services
    VOB->>RBAC: check assessment:create
    RBAC-->>VOB: allowed · user_context attached
    VOB->>LG: initiate_assessment(vendor, user_context)
    LG->>SDB: audit: assessment.created · sarah.chen

    rect rgb(230, 241, 251)
    Note over LG,QDB: policy retrieval
    LG->>RAG: GET /retrieve · query: cloud vendor onboarding requirements
    RAG->>QDB: hybrid_search(dense + BM25)
    QDB-->>RAG: 4 chunks · scores 0.94  0.91  0.87  0.82
    RAG-->>LG: grounded chunks + citations
    LG->>SDB: audit: policy.retrieved · rag-service
    end

    rect rgb(238, 237, 254)
    Note over LG,OAI: risk assessment
    LG->>OAI: chat_completion(risk_prompt + policy_chunks)
    OAI-->>LG: risk=Medium · confidence=87%
    LG->>SDB: audit: risk.assessed · langgraph-agent
    LG->>SDB: audit: recommendation.generated · langgraph-agent
    end

    LG->>SDB: workflow_state = awaiting_approval
    LG->>RBAC: route approval to security_approver
    VOB-->>Michael: approval request · Risk Medium · approve with conditions
    LG->>SDB: audit: approval.requested · hitl-gateway

    Note over Michael,VOB: 12 minutes elapsed

    Michael->>VOB: POST /approvals/{id} · decision=approve
    VOB->>RBAC: check assessment:approve
    RBAC-->>VOB: allowed
    VOB->>LG: approval_received · actor=michael.davidson
    LG->>SDB: workflow_state = completed
    LG->>SDB: audit: approval.granted · michael.davidson
    LG->>SDB: audit: workflow.completed · langgraph-agent
    VOB-->>Sarah: 200 OK · status=approved · elapsed=2h 14m
```

## Audit trail (7 events)

| # | Operation | Actor | Outcome |
|---|---|---|---|
| 1 | `assessment.created` | sarah.chen | success |
| 2 | `policy.retrieved` | rag-service | success |
| 3 | `risk.assessed` | langgraph-agent | success |
| 4 | `recommendation.generated` | langgraph-agent | success |
| 5 | `approval.requested` | hitl-gateway | success |
| 6 | `approval.granted` | michael.davidson | success |
| 7 | `workflow.completed` | langgraph-agent | success |
