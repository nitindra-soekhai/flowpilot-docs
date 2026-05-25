# C4 — Container Level

> Shows the internal structure of the FlowPilot platform: the services, their responsibilities, and how they communicate.

```mermaid
C4Container
    title FlowPilot Platform — Container Diagram

    Person(procurement, "Procurement Manager")
    Person(approver, "Security Approver")

    System_Ext(openai, "OpenAI API")
    System_Ext(qdrant, "Qdrant Vector DB")
    System_Ext(keycloak, "Keycloak 24", "OIDC identity provider — JWKS endpoint, realm: flowpilot. ADR-012.")

    System_Boundary(flowpilot, "FlowPilot Platform") {

        Container(ui, "React UI", "Vite + React 18 + Tailwind + keycloak-js", "9-scene workflow UI: vendor intake → RAG retrieval → AI security findings → HITL approval → audit trail. Port 3000.")

        Container(vo_api, "Vendor Onboarding API", "Python / FastAPI", "REST API — workflow lifecycle, HITL decisions, policy queries, event history")
        Container(langgraph, "LangGraph Orchestrator", "Python / LangGraph", "Vendor assessment state machine: INITIATED → DOCUMENTS_COLLECTED → SECURITY_REVIEW → PENDING_APPROVAL → APPROVED/REJECTED")
        Container(vo_db, "Workflow State Store", "SQLite", "workflows, workflow_events, audit_log, dead_letter tables")

        Container(rag_api, "RAG Service API", "Python / FastAPI", "REST API — document ingestion and policy query endpoints. Port 8000.")
        Container(ingest_queue, "Ingestion Queue", "FastAPI BackgroundTasks (demo) / Azure Service Bus (production)", "Decouples POST /ingest from embedding pipeline. Returns job_id + 202 immediately. ADR-014.")
        Container(ingestion, "Ingestion Pipeline", "Python / LangChain", "PDF → chunk → embed → Qdrant. Hybrid chunking strategy with overlap.")
        Container(retrieval, "Retrieval Pipeline", "Python / LangChain + Qdrant", "Hybrid dense+sparse retrieval, reciprocal rank fusion, confidence threshold, guardrails")
        Container(rag_db, "RAG Audit Store", "SQLite", "retrieval_log, audit_log — query, scores, latency, token usage per request")
    }

    Rel(procurement, ui, "Initiates onboarding, monitors progress", "HTTPS / Browser")
    Rel(approver, ui, "Reviews findings, submits decision", "HTTPS / Browser")
    Rel(ui, vo_api, "POST /workflows/, GET /workflows/{id}/events (poll every 2s)", "HTTPS / JSON")
    Rel(ui, keycloak, "OIDC Authorization Code flow", "HTTPS")
    Rel(ui, rag_api, "GET /ingest/jobs/{id} — ingestion status", "HTTPS / JSON")


    Rel(vo_api, keycloak, "Validates JWT via JWKS — RS256", "HTTPS")
    Rel(vo_api, langgraph, "Invokes graph on workflow creation", "In-process")
    Rel(langgraph, vo_db, "Persists state after each node", "aiosqlite")
    Rel(langgraph, rag_api, "GET policy guidance per step", "HTTP — X-Trace-ID header")

    Rel(rag_api, keycloak, "Validates M2M JWT via JWKS — RS256", "HTTPS")
    Rel(rag_api, ingest_queue, "Enqueues ingestion job on POST /ingest", "In-process")
    Rel(ingest_queue, ingestion, "Worker consumes job: parse → chunk → embed → store", "Async")
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
Single FastAPI application. Handles auth (JWT RS256 via Keycloak JWKS, RBAC), trace ID generation, workflow CRUD, and HITL decision routing. Does not contain business logic — delegates to the LangGraph orchestrator.

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
