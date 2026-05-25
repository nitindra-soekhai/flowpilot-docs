# C4 — Context Level

> Shows FlowPilot in context: who uses it, what external systems it depends on.

```mermaid
C4Context
    title FlowPilot Platform — System Context

    Person(procurement, "Procurement Manager", "Initiates vendor onboarding requests, queries policy guidance")
    Person(approver, "Security Approver", "Reviews security findings, approves or rejects onboarding workflows")
    Person(admin, "Platform Admin", "Ingests policy documents, monitors audit log and dead-letter queue")

    System_Boundary(flowpilot, "FlowPilot Platform") {
        System(vo, "Vendor Onboarding Service", "Orchestrates vendor assessment workflow with LangGraph. Enforces HITL approval gate.")
        System(rag, "RAG Service", "Ingests policy documents. Answers policy queries with grounded, cited responses.")
    }

    System_Ext(openai, "OpenAI API", "LLM inference (GPT-4o) and embeddings (text-embedding-3-large)")
    System_Ext(qdrant, "Qdrant", "Dense + sparse vector storage for policy knowledge base")
    System_Ext(github, "GitHub", "Source control, CI/CD, tagged releases")
    System_Ext(keycloak, "Keycloak 24", "OIDC identity provider — Authorization Code flow for UI, JWKS for JWT validation. Realm: flowpilot. See ADR-012.")

    Rel(procurement, vo, "Initiates onboarding, queries policy via React UI", "HTTPS REST / JSON")
    Rel(approver, vo, "Approves or rejects workflows via React UI", "HTTPS REST / JSON")
    Rel(admin, rag, "Uploads policy PDFs, monitors retrieval quality", "HTTPS REST / JSON")
    Rel(vo, rag, "Retrieves policy guidance per workflow step", "HTTPS REST — X-Trace-ID propagated")
    Rel(rag, openai, "Embeds documents and queries, generates grounded responses", "HTTPS")
    Rel(rag, qdrant, "Stores and retrieves policy embeddings", "gRPC")
    Rel(procurement, keycloak, "Authenticates via OIDC login", "HTTPS")
    Rel(approver, keycloak, "Authenticates via OIDC login", "HTTPS")
    Rel(vo, keycloak, "Validates JWT via JWKS endpoint", "HTTPS")
    Rel(rag, keycloak, "Validates M2M JWT via JWKS endpoint", "HTTPS")
```

---

## Key context decisions

**React UI**
The React UI (Vite + React 18 + Tailwind, port 3000) is the user-facing client for both roles. It authenticates via Keycloak Authorization Code flow (keycloak-js). Session expiry triggers auto-redirect to Keycloak login. The UI is not shown as a separate internal System in this context diagram as it is a thin client — all business logic lives in the two internal services.

**Why two internal systems?**
The RAG service is domain-agnostic — it answers policy questions for any domain. The vendor onboarding service consumes it. Keeping them separate means a future HR onboarding or procurement domain can use the same RAG service without modification. See [ADR-007](../adr/ADR-007-retrieval-separated-from-orchestration.md).

**Why OpenAI?**
Single provider reduces integration surface for portfolio scope. The LLM abstraction layer allows swap to Azure OpenAI, Anthropic, or self-hosted without service-level changes. See [ADR-006](../adr/ADR-006-fastapi-over-spring-boot.md) for the technology rationale.

**Who cannot approve their own requests?**
The system enforces this structurally. The procurement_manager role can create workflows; the security_approver role can decide them. No JWT in the system carries both roles. The agent cannot call the decisions endpoint on its own behalf — it does not hold a security_approver token. See [ADR-004](../adr/ADR-004-hitl-platform-concern.md).
