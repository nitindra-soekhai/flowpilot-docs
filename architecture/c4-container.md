# C4 — Container Level

> Shows the internal structure of the FlowPilot platform: the services, their responsibilities, and how they communicate.

```mermaid
C4Container
    title FlowPilot Platform — Container Diagram

    Person(procurement, "Procurement Manager")
    Person(approver, "Security Approver")

    System_Ext(openai, "OpenAI API")
    System_Ext(qdrant, "Qdrant Vector DB")

    System_Boundary(flowpilot, "FlowPilot Platform") {

        Container(vo_api, "Vendor Onboarding API", "Python / FastAPI", "REST API — workflow lifecycle, HITL decisions, policy queries, event history")
        Container(langgraph, "LangGraph Orchestrator", "Python / LangGraph", "Vendor assessment state machine: INITIATED → DOCUMENTS_COLLECTED → SECURITY_REVIEW → PENDING_APPROVAL → APPROVED/REJECTED")
        Container(vo_db, "Workflow State Store", "SQLite", "workflows, workflow_events, audit_log, dead_letter tables")

        Container(rag_api, "RAG Service API", "Python / FastAPI", "REST API — document ingestion and policy query endpoints")
        Container(ingestion, "Ingestion Pipeline", "Python / LangChain", "PDF → chunk → embed → Qdrant. Hybrid chunking strategy with overlap.")
        Container(retrieval, "Retrieval Pipeline", "Python / LangChain + Qdrant", "Hybrid dense+sparse retrieval, reciprocal rank fusion, confidence threshold, guardrails")
        Container(rag_db, "RAG Audit Store", "SQLite", "retrieval_log, audit_log — query, scores, latency, token usage per request")
    }

    Rel(procurement, vo_api, "POST /workflows/, GET /workflows/{id}", "HTTPS / JSON")
    Rel(approver, vo_api, "POST /workflows/{id}/decisions", "HTTPS / JSON — security_approver JWT required")

    Rel(vo_api, langgraph, "Invokes graph on workflow creation", "In-process")
    Rel(langgraph, vo_db, "Persists state after each node", "aiosqlite")
    Rel(langgraph, rag_api, "GET policy guidance per step", "HTTP — X-Trace-ID header")

    Rel(rag_api, ingestion, "Triggers on POST /ingest", "In-process")
    Rel(rag_api, retrieval, "Triggers on POST /query", "In-process")
    Rel(ingestion, qdrant, "Stores dense + sparse vectors", "gRPC")
    Rel(retrieval, qdrant, "Hybrid vector search", "gRPC")
    Rel(retrieval, openai, "Embed query, generate grounded response", "HTTPS")
    Rel(retrieval, rag_db, "Write retrieval audit row", "aiosqlite")
    Rel(vo_api, vo_db, "Write audit_log row per request", "aiosqlite")
```

---

## Container responsibilities

### Vendor Onboarding API
Single FastAPI application. Handles auth (JWT HS256 RBAC), trace ID generation, workflow CRUD, and HITL decision routing. Does not contain business logic — delegates to the LangGraph orchestrator.

### LangGraph Orchestrator
The vendor assessment state machine. Five nodes: `initiate` → `collect_documents` → `security_review` → `pending_approval` → `finalize`. Each node reads from and writes to the SQLite workflow store. The `pending_approval` node is the HITL gate — it saves state and returns; the graph resumes only when a security_approver calls the decisions endpoint.

### Workflow State Store
Three tables: `workflows` (canonical state), `workflow_events` (append-only audit trail per workflow), `audit_log` (all API-level auth and action events), `dead_letter` (failed steps after retry exhaustion). See [ADR-005](../adr/ADR-005-sqlite-workflow-state.md) for upgrade path to PostgreSQL.

### RAG Service API
Separate FastAPI application on port 8000. Domain-agnostic. Accepts `POST /ingest` (PDF → vector store) and `POST /query` (natural language → grounded response). Has no knowledge of vendor onboarding.

### Retrieval Pipeline
Hybrid dense + sparse retrieval fused via reciprocal rank fusion. Confidence threshold check before LLM call. Guardrails layer validates citation before returning response. See [ADR-002](../adr/ADR-002-hybrid-retrieval.md).

### RAG Audit Store
Every retrieval operation writes a row: query text, retrieval strategy, top-k scores, latency ms, confidence threshold met/failed, tokens in/out, model identifier, trace ID. Full AI decision chain is reconstructable from this log.
