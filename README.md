# FlowPilot — Enterprise AI Orchestration Platform

**Built by Nitindra Soekhai · NSCS B.V.**

> An enterprise AI orchestration platform demonstrating senior AI architect capabilities — designed as a reusable platform, demonstrated through a vendor onboarding use case. RAG architecture, agentic orchestration, human-in-the-loop governance, operational resilience, and full observability.

**The vendor onboarding workflow is the demonstration domain. FlowPilot is the platform.**

---

## Why This Architecture?

This section explains the decisions that distinguish architectural thinking from engineering execution.

### Why deterministic retrieval first?

Policy guidance is a retrieval problem, not a reasoning problem. Employees need accurate, cited answers from authoritative policy documents — not LLM-generated approximations. Deterministic hybrid retrieval (dense + sparse vectors, RRF fusion) with a confidence gate ensures answers are grounded, traceable, and consistent. Where determinism is possible, it is preferred over autonomy.

### Why agentic AI only where orchestration is genuinely required?

Vendor onboarding requires sequential, stateful decision-making across multiple steps — each dependent on the output of the previous. A static retrieval pipeline cannot handle conditional branching, tool sequencing, human interruption, or compensating actions. LangGraph is introduced only at this boundary. Agentic execution is not the default — it is the deliberate choice for problems that require it.

### Why HITL exists as an architectural concern, not a feature?

The agent produces recommendations grounded in retrieved policy. It cannot assess business context, relationship factors, or exception criteria that a human approver holds. HITL is not a safety net added after the fact — it is the explicit boundary between AI autonomy and human authority, enforced at the platform level. The agent is designed to pause. That is not a limitation. That is the governance model.

### Why Qdrant over pgvector?

Vendor onboarding policies contain regulatory identifiers (ISO 27001 control numbers, GDPR Article references, SOC 2 criteria) that semantic search deprioritises. Dense-only search ranked semantically fluent chunks above chunks containing exact clause references. Qdrant supports both dense and sparse vectors natively in a single collection — enabling hybrid retrieval without a join across two systems. See ADR-001.

### Why LangGraph over a custom orchestration engine?

LangGraph provides state machine semantics, checkpoint persistence, and conditional edge routing without requiring a custom workflow engine. The 5-node state machine maps directly to the vendor assessment lifecycle. State is persisted after each node — enabling workflow recovery on restart without re-execution. LangGraph is restricted to the domain layer (ADR-003) to prevent framework lock-in at the platform level.

### Why SQLite for workflow state?

At portfolio scope, SQLite provides zero-config persistent state with ANSI SQL portability. The schema is designed for migration: replacing SQLite with PostgreSQL requires a config change, not an application rewrite. The accepted tradeoff is documented explicitly in ADR-005. Production migration path: change the connection string, run the schema migration, no application code changes.

### Why RBAC enforced at the platform level?

Role-based access control applied per-domain produces duplicated, inconsistent enforcement. FlowPilot enforces RBAC at the platform layer — every agent tool call is validated against the requesting user's permission set before execution. An agent cannot exceed the permissions of the user who triggered it, regardless of what the agent decides to do.

---

## Enterprise Concerns

FlowPilot is designed against the concerns that enterprise architecture review boards, security teams, and AI governance committees evaluate.

| Concern | How FlowPilot addresses it |
|---|---|
| **Multi-tenant isolation** | Planned — workflow state and audit events are user-scoped; tenant isolation is the documented production upgrade path |
| **RBAC enforcement** | Platform-level via Keycloak JWT validation; role extraction filters system roles; agent tool calls validated against user permissions |
| **Auditability & traceability** | `trace_id` generated at API boundary, propagated across all service calls; 11 structured audit event types; full decision chain reconstructable |
| **Prompt governance** | Grounding pipeline enforces citation; guardrails layer blocks uncited responses; prompt template versioning documented |
| **Hallucination reduction** | Confidence gate (avg_score ≥ 0.65) blocks LLM call on low-quality retrieval; agent suspends and requests human clarification |
| **Deterministic retrieval** | Hybrid RRF fusion; confidence threshold; top-k chunk scoring visible in audit trail |
| **Human-in-the-loop escalation** | HITL gate at `request_approval` node; agent pauses; approval timeout triggers compensating action and escalation |
| **Retry & degraded mode** | Exponential backoff (500ms, ×2, max 3 attempts); RAG unavailable → structured questionnaire fallback; `degraded=true` in all log lines |
| **Idempotent workflows** | Unique constraint on `request_id` prevents duplicate workflow creation under network retry conditions |
| **Policy-grounded AI decisions** | Retrieved policy chunks injected into prompt with citation instruction; response blocked if no source cited |

---

## Why Agents Are Not Always the Answer

FlowPilot intentionally separates deterministic and agentic execution. This separation is the core architectural decision.

**Deterministic retrieval is used when:**
- The answer exists in a policy document
- Consistency and reproducibility are required
- Governance demands a traceable, cited source
- The operation is stateless and query-response in nature

**Agentic execution is used only when:**
- Multiple dependent decisions exist across sequential steps
- Stateful orchestration is required between operations
- Tool sequencing is dynamic and context-dependent
- Human approval may interrupt execution mid-workflow
- Compensating actions must be triggered on failure

**The result:** RAG handles policy guidance. LangGraph handles workflow orchestration. Neither crosses the other's boundary (ADR-007). A future domain — contract management, IT provisioning, compliance assessment — can consume the RAG service without touching the agentic layer.

Agentic AI applied where determinism suffices produces unpredictable, ungovernable, and unauditable systems. FlowPilot is deliberately structured to prevent this.

---

## What FlowPilot Demonstrates

| Capability | What it delivers |
|---|---|
| **Policy Guidance** | Grounded, cited answers from the enterprise knowledge base via hybrid RAG retrieval |
| **Workflow Orchestration** | Autonomous 5-stage LangGraph agent: collect → retrieve → assess → approve → complete |
| **Approval Coordination** | Multi-department approval routing with escalation, timeout handling, and preserved human authority |
| **Audit & Traceability** | `trace_id` correlation across services; 11 structured event types; full decision chain reconstructable |
| **Governed AI Interaction** | AI may recommend, never approve. RBAC bounds agent scope. Uncited guidance is blocked. |

---

## Production Readiness

| Capability | Status |
|---|---|
| RAG retrieval (hybrid RRF, confidence gate) | ✅ Implemented |
| Agentic state machine (LangGraph, 5 nodes) | ✅ Implemented |
| HITL approval gate | ✅ Implemented |
| RBAC enforcement (Keycloak OIDC, JWT) | ✅ Implemented |
| Audit trail (11 event types, trace_id) | ✅ Implemented |
| Operational resilience (retry, dead-letter, degraded mode) | ✅ Implemented |
| Idempotency guarantees | ✅ Implemented |
| Workflow checkpoint recovery | ✅ Implemented |
| Structured JSON logging (structlog) | ✅ Implemented |
| Policy document management UI | 🔄 In progress |
| Evaluation pipeline (retrieval quality, LLM output) | 📋 Planned |
| Multi-tenancy isolation | 📋 Planned |
| Operational SLIs/SLOs | 📋 Planned |
| Cost governance (token budget, per-workflow tracking) | 📋 Planned |
| Production infrastructure (AKS, APIM, ingress) | 📋 Planned |

---

## Live Demo — Full User Journey

The screenshots below show the complete end-to-end flow across both user roles. All data is live — real Keycloak JWT tokens, real LangGraph agent execution, real audit events from the API.

### Step 1 — Keycloak OIDC Login (sarah.chen · procurement_manager)
![Keycloak Login sarah.chen](docs/images/screenshots/01-keycloak-login-sarah.png)
> Keycloak 24 OIDC Authorization Code flow. JWT issued on sign-in, attached as Bearer token to all subsequent API calls. See ADR-012.

### Step 2 — New Vendor Request Form
![Vendor Form](docs/images/screenshots/02-vendor-form.png)
> `POST /workflows/` with Bearer token → LangGraph state machine starts → `workflow_id` and `trace_id` generated.

### Step 3 — Security Findings (AI-generated, policy-grounded)
![Security Findings](docs/images/screenshots/03-security-findings.png)
> LangGraph `assess_risk` node calls OpenAI GPT-4o with retrieved policy chunks. Findings grounded in real policy references (SEC-101, SEC-103, RISK-301). Confidence scores reflect RAG retrieval quality.

![Security Findings — Action Required](docs/images/screenshots/04-security-findings-action.png)
> Findings routed to security approval queue. Human review required — this is the HITL gate (ADR-004).

### Step 4 — Account Switch to michael.davidson (security_approver)
![Keycloak Login michael.davidson](docs/images/screenshots/05-keycloak-login-michael.png)
> New JWT with `security_approver` role. Approval queue pre-loads the correct workflow.

### Step 5 — Approval Queue (HITL Gate)
![Approval Queue](docs/images/screenshots/06-approval-queue.png)
> Decision submitted via `POST /workflows/{id}/approve` with Bearer token. RBAC enforced: only `security_approver` reaches this endpoint.

### Step 6 — Workflow Complete
![Workflow Complete](docs/images/screenshots/07-workflow-complete.png)
> Traditional process: 45–60 days. FlowPilot: ~15 minutes. The agent executed autonomously; a human made the final call.

### Step 7 — Audit Trail (11 real events, trace_id correlated)
![Audit Trail](docs/images/screenshots/08-audit-trail.png)
> Every event carries `trace_id`, `service` tag (`rag` / `workflow` / `security`), actor, and CET timestamp.

![Audit Trail Event Log](docs/images/screenshots/09-audit-trail-events.png)
> `workflow.created` → `rag.query.initiated` → `rag.query.completed` → `security.analysis.started` — all correlated by the same `trace_id`.

---

## Architecture

### Two AI Paradigms — Explicitly Separated

```mermaid
flowchart TD
    UI(["🖥️ FlowPilot UI\nReact 18 · Vite · Tailwind · Port 3000"])
    KC(["🔐 Keycloak 24\nOIDC Identity Provider · Port 8080"])

    UI -- "OIDC Auth Code Flow" --> KC
    KC -- "JWT Bearer Token" --> UI

    subgraph RAG ["🔵 RAG Paradigm — flowpilot-rag-service · Port 8000 · Stateless · Domain-agnostic"]
        direction LR
        INGEST["📄 PDF Ingest\nLangChain loader + splitter"]
        EMBED["🧮 OpenAI\ntext-embedding-3-large"]
        QDRANT[("🗄️ Qdrant\nDense + Sparse Vectors")]
        HYBRID["⚡ Hybrid RRF Fusion\n0.7 dense · 0.3 sparse"]
        CONF{"Confidence Gate\navg_score ≥ 0.65"}
        GUARD["🛡️ Grounding Pipeline\n+ AI Guardrails"]
        BLOCKED(["❌ Blocked\nLow confidence"])

        INGEST --> EMBED --> QDRANT
        QDRANT --> HYBRID --> CONF
        CONF -- "✓ pass" --> GUARD
        CONF -- "✗ fail" --> BLOCKED
    end

    subgraph AGENT ["🟣 Agentic AI Paradigm — flowpilot-vendor-onboarding · Port 8001 · Stateful · LangGraph"]
        direction TB
        N1["collect_vendor_info"]
        N2["retrieve_policies"]
        N3["assess_risk\nOpenAI GPT-4o"]
        N4[/"⏸️ request_approval\nHITL GATE — agent pauses"/]
        N5(["✅ complete\n11 audit events · SQLite state"])

        N1 --> N2 --> N3 --> N4
        N4 -- "Human decision required" --> N5
    end

    OAI(["🤖 OpenAI Platform\nGPT-4o · text-embedding-3-large"])

    UI -- "POST /workflows/ + Bearer" --> AGENT
    N2 -- "POST /query" --> GUARD
    GUARD -- "grounded response + avg_score + trace_id" --> N2
    N3 --> OAI
    EMBED --> OAI
```

### Architecture Diagrams

![FlowPilot Assistance & Retrieval Architecture](docs/images/fig1-architecture.png)

![FlowPilot Stack to Repository Mapping](docs/images/fig2-repo-mapping.png)

---

## Deployment Architecture

> **Current scope:** Local Docker Compose. The production architecture below documents the target deployment — demonstrating infrastructure thinking beyond the portfolio implementation.

```
Internet → Azure API Management (APIM)
                │
                ├── /api/rag/*      → flowpilot-rag-service        (AKS pod)
                ├── /api/workflow/* → flowpilot-vendor-onboarding   (AKS pod)
                └── /auth/*         → Keycloak 24                   (AKS pod)

AKS Cluster (flowpilot namespace)
├── flowpilot-rag-service         (2 replicas, HPA on CPU/memory)
├── flowpilot-vendor-onboarding   (2 replicas, HPA)
├── keycloak                      (1 replica, PostgreSQL backend)
├── qdrant                        (StatefulSet, persistent volume)
└── nginx-ingress                 (TLS termination, path routing)

Data layer
├── Azure Database for PostgreSQL  (Keycloak, workflow state — replaces SQLite)
├── Qdrant                         (vector store, PVC)
└── Azure Blob Storage             (policy document store)

Observability
├── Azure Monitor + Log Analytics  (structured JSON log ingestion)
├── Application Insights           (distributed tracing, trace_id correlation)
└── Azure Managed Grafana          (retrieval metrics, HITL queue depth)

Secrets management
└── Azure Key Vault                (OPENAI_API_KEY, DB credentials, Keycloak secrets)

CI/CD
└── GitHub Actions
    ├── build + test (pytest, coverage gate)
    ├── docker build + push (GHCR)
    └── kubectl apply (AKS rolling deploy)
```

| Decision | Rationale |
|---|---|
| APIM as gateway | Centralised rate limiting, JWT validation, API versioning, and token cost governance |
| AKS over ACI | Horizontal scaling, health probes, rolling deployments, namespace-level isolation |
| Qdrant as StatefulSet | Requires persistent volumes and stable network identity |
| PostgreSQL for production | SQLite replaced at production scope; schema migration is config-only (ADR-005) |
| Key Vault for secrets | Injected via CSI driver — never in environment variables in production |

---

## Traceability — Every AI Decision Is Reconstructable

```mermaid
sequenceDiagram
    actor Sarah as 👤 sarah.chen<br/>(procurement_manager)
    actor Michael as 👤 michael.davidson<br/>(security_approver)
    participant UI as FlowPilot UI
    participant KC as Keycloak 24
    participant AGENT as vendor-onboarding<br/>LangGraph Agent
    participant RAG as rag-service<br/>Hybrid Retrieval
    participant OAI as OpenAI<br/>GPT-4o

    Sarah->>KC: Login (OIDC Auth Code Flow)
    KC-->>UI: JWT Bearer · role: procurement_manager
    Sarah->>UI: Submit vendor onboarding request
    UI->>AGENT: POST /workflows/ + Bearer JWT
    Note over AGENT: ✦ trace_id generated<br/>📋 workflow.created emitted
    AGENT->>RAG: POST /query + X-Trace-ID header
    Note over RAG: 📋 rag.query.initiated emitted
    RAG->>OAI: Embed query (text-embedding-3-large)
    OAI-->>RAG: Dense vector
    RAG-->>AGENT: Grounded response + avg_score + trace_id
    Note over RAG: 📋 rag.query.completed emitted
    AGENT->>OAI: GPT-4o · security risk assessment
    Note over AGENT: 📋 security.findings.generated emitted<br/>📋 workflow.routed emitted
    Note over AGENT: ⏸ HITL GATE — agent pauses
    Michael->>KC: Login (account switch)
    KC-->>UI: JWT Bearer · role: security_approver
    UI->>AGENT: POST /workflows/{id}/approve + Bearer
    Note over AGENT: 📋 approval.decision.submitted emitted<br/>📋 workflow.completed emitted
    UI->>AGENT: GET /workflows/{id}/events + Bearer
    AGENT-->>UI: 11 events · all correlated by trace_id
```

---

## Retrieval Scoring & Confidence

| Metric | What it means | Target |
|---|---|---|
| `avg_score` | Average similarity score of retrieved chunks (0–1) | > 0.65 |
| `confidence_met` | Whether avg_score exceeded the confidence threshold | `true` |
| `results_count` | Number of chunks returned (top-k) | 5 |
| `latency_ms` | Total retrieval + LLM grounding time | < 3000ms |
| `strategy` | Retrieval mode used | `hybrid` |

---

## Governance Boundaries

| Boundary | Enforcement |
|---|---|
| **AI may recommend, never approve** | HITL gate in LangGraph — agent pauses and cannot self-approve |
| **Explanations must cite sources** | Guardrails layer blocks any response without retrieved context reference |
| **Low confidence blocks continuation** | Confidence threshold gate suspends the agent below 0.65 |
| **RBAC bounds agent scope** | Agent cannot exceed permissions of the triggering user |
| **All decisions are logged** | Every LLM call, retrieval, decision, and approval written to audit log |

---

## Architecture Decision Records

| ADR | Layer | Decision |
|---|---|---|
| [ADR-001](adr/ADR-001-qdrant-over-pgvector.md) | 🔵 RAG | Qdrant over PostgreSQL pgvector |
| [ADR-002](adr/ADR-002-hybrid-retrieval.md) | 🔵 RAG | Hybrid retrieval over dense-only |
| [ADR-003](adr/ADR-003-langgraph-domain-only.md) | 🟣 Agentic AI | LangGraph restricted to domain layer |
| [ADR-004](adr/ADR-004-hitl-platform-concern.md) | 🟣 Agentic AI | HITL as platform-level concern |
| [ADR-005](adr/ADR-005-sqlite-workflow-state.md) | 🟣 Agentic AI | SQLite accepted for workflow state |
| [ADR-006](adr/ADR-006-fastapi-over-spring-boot.md) | 🟢 Shared | FastAPI over Spring Boot |
| [ADR-007](adr/ADR-007-retrieval-separated-from-orchestration.md) | 🟡 Boundary | Retrieval service separated from orchestration |
| [ADR-008](adr/ADR-008-vendor-onboarding-domain.md) | 🟢 Shared | Vendor onboarding as demonstration domain |
| [ADR-009](adr/ADR-009-mock-mode.md) | 🟢 Shared | Mock mode for zero-friction demonstration |
| [ADR-010](adr/ADR-010-structlog-json-logging.md) | 🟢 Shared | Structured JSON logging over traditional logging |
| [ADR-011](adr/ADR-011-no-reranking-layer.md) | 🔵 RAG | No dedicated reranking layer at portfolio scope |
| [ADR-012](adr/ADR-012-keycloak-identity-provider.md) | 🟢 Shared | Keycloak as identity provider |

---

## Operational Resilience

| Mechanism | Implementation |
|---|---|
| **Retry** | Exponential backoff with jitter — 500ms initial, ×2 multiplier, max 3 attempts |
| **Dead-letter** | Failed steps written to SQLite dead-letter table with full execution context |
| **Compensating actions** | Approval timeout triggers stakeholder notification and state revert |
| **Degraded mode** | RAG unavailable → structured questionnaire fallback, flagged in log and UI |
| **Idempotency** | Unique constraint on request ID prevents duplicate workflow creation |
| **Workflow recovery** | LangGraph state persisted after each node — resumes from last checkpoint on restart |

---

## Release History

| Release | What it demonstrates |
|---|---|
| **v1.1-authentication-ui** | Keycloak OIDC, React UI 9 scenes, real audit trail (11 events), ADR-012 |
| **v1.0-final** | Complete platform, all ADRs, C4 diagrams, governance model |
| **v0.3-iteration-2** | Operational resilience, AI governance, observability complete |
| **v0.2-iteration-1** | Hybrid retrieval, agentic workflow, HITL approval |
| **v0.1-mvp** | RAG service: hybrid retrieval, observability foundation, unit tests |

---

## Repository Map

| Repository | Purpose |
|---|---|
| **flowpilot-docs** ← *you are here* | Architecture docs: C4 diagrams, 12 ADRs, governance model, sequence diagrams |
| [flowpilot-rag-service](https://github.com/nitindra-soekhai/flowpilot-rag-service) | RAG: PDF ingestion, hybrid retrieval, grounding pipeline, guardrails |
| [flowpilot-vendor-onboarding](https://github.com/nitindra-soekhai/flowpilot-vendor-onboarding) | Agentic AI: LangGraph state machine, HITL approval gate, SQLite state |
| [flowpilot-ui](https://github.com/nitindra-soekhai/flowpilot-ui) | React 18 UI: 9 scenes, Keycloak OIDC, approval queue, audit trail |

---

## Stack

| Layer | Technology |
|---|---|
| RAG framework | LangChain — document loaders, text splitters, retrieval chains |
| Vector store | Qdrant (Docker) — dense + sparse hybrid retrieval |
| Embeddings | OpenAI text-embedding-3-large |
| LLM | OpenAI GPT-4o |
| Agentic orchestration | LangGraph — 5-node vendor assessment state machine |
| Workflow state | SQLite via aiosqlite |
| Backend | Python / FastAPI (both services) |
| Identity provider | Keycloak 24 — OIDC/OAuth2, Docker-hosted |
| Frontend | React 18 + Vite + Tailwind CSS + keycloak-js |
| Observability | structlog JSON logging, trace_id correlation, SQLite audit trail |

---

## How to Run

```powershell
cd flowpilot-rag-service && docker compose up        # Terminal 1
cd flowpilot-vendor-onboarding && docker compose up  # Terminal 2
cd flowpilot-ui && npm run dev                       # Terminal 3 → http://localhost:3000
```

**Login credentials:** `sarah.chen` (procurement_manager) · `michael.davidson` (security_approver)
> Credentials available on request for evaluation purposes.

`FP_MOCK_MODE=true` — no OpenAI key required. Full workflow, observability, and resilience demonstrable without API cost.

---

*FlowPilot · NSCS B.V. · Built by Nitindra Soekhai · May 2026*
