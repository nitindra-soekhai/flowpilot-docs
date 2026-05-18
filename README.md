# FlowPilot — AI Platform Portfolio

**Built by Nitindra Soekhai · NSCS B.V.**

> An enterprise-grade AI platform demonstrating senior AI architect capabilities across RAG architecture, agentic orchestration, human-in-the-loop governance, operational resilience, and full observability — built around a realistic vendor onboarding use case.

---

## What FlowPilot Does

FlowPilot is an AI-assisted **vendor onboarding coordination platform** for large enterprises. It solves a real operational problem: vendor onboarding in enterprise environments requires coordination across procurement, security, legal, compliance, and IT — resulting in delays, inconsistent policy interpretation, unclear approval ownership, and lack of transparency.

FlowPilot addresses this by combining two distinct AI paradigms in a governed, auditable platform:

| Capability | What it delivers |
|---|---|
| **Policy Guidance** | Employees ask onboarding questions in natural language and receive grounded, cited policy answers retrieved from the enterprise knowledge base |
| **Workflow Orchestration** | An AI agent autonomously moves a vendor onboarding request through a 5-stage workflow: collect → retrieve → assess → approve → complete |
| **Approval Coordination** | Multi-department approval routing (procurement, security, legal, compliance) with escalation, timeout handling, and human authority preserved |
| **Audit & Traceability** | Every AI decision, retrieval call, and approval action is logged with a shared `trace_id` — fully reconstructable from request to resolution |
| **Governed AI Interaction** | AI may recommend, never approve. RBAC bounds what the agent can access. Uncited guidance is blocked by the guardrails layer |

---

## Live Demo — Full User Journey

The screenshots below show the complete end-to-end flow across both user roles. All data is live — real Keycloak JWT tokens, real LangGraph agent execution, real audit events from the API.

### Step 1 — Keycloak OIDC Login (sarah.chen · procurement_manager)
![Keycloak Login sarah.chen](docs/images/screenshots/01-keycloak-login-sarah.png)
> Keycloak 24 OIDC Authorization Code flow. Browser redirected to `localhost:8080/realms/flowpilot`. JWT issued on sign-in, attached as Bearer token to all subsequent API calls. See ADR-012.

### Step 2 — New Vendor Request Form
![Vendor Form](docs/images/screenshots/02-vendor-form.png)
> `sarah.chen` (procurement_manager) submits a vendor onboarding request. On submit: `POST /workflows/` with Bearer token → LangGraph state machine starts → `workflow_id` and `trace_id` generated.

### Step 3 — Security Findings (AI-generated, policy-grounded)
![Security Findings](docs/images/screenshots/03-security-findings.png)
> LangGraph `assess_risk` node calls OpenAI GPT-4o with retrieved policy chunks as context. Findings are grounded in real policy references (SEC-101, SEC-103, RISK-301). Confidence scores (78–95%) reflect RAG retrieval quality.

![Security Findings — Action Required](docs/images/screenshots/04-security-findings-action.png)
> Findings routed to security approval queue. Human review required before onboarding proceeds — this is the HITL gate (ADR-004).

### Step 4 — Account Switch to michael.davidson (security_approver)
![Keycloak Login michael.davidson](docs/images/screenshots/05-keycloak-login-michael.png)
> `keycloak.logout()` called with `redirectUri` preserving `workflow_id`. michael.davidson signs in — new JWT with `security_approver` role. Approval queue pre-loads the correct workflow.

### Step 5 — Approval Queue (HITL Gate)
![Approval Queue](docs/images/screenshots/06-approval-queue.png)
> michael.davidson sees the pending workflow submitted by sarah.chen. Decision submitted via `POST /workflows/{id}/approve` with Bearer token. RBAC enforced: only `security_approver` role reaches this endpoint.

### Step 6 — Workflow Complete
![Workflow Complete](docs/images/screenshots/07-workflow-complete.png)
> Traditional process: 45–60 days. FlowPilot: ~15 minutes. The agent executed autonomously; a human made the final call.

### Step 7 — Audit Trail (11 real events, trace_id correlated)
![Audit Trail](docs/images/screenshots/08-audit-trail.png)
> `GET /workflows/{id}/events` called with Bearer token. Every event carries `trace_id`, `service` tag (`rag` / `workflow` / `security`), actor, and CET timestamp. Full reconstruction of the AI decision chain.

![Audit Trail Event Log](docs/images/screenshots/09-audit-trail-events.png)
> `workflow.created` → `rag.query.initiated` → `rag.query.completed` → `security.analysis.started` — all correlated by the same `trace_id`. Filter by service to isolate any layer.

---

## Architecture

### Two AI Paradigms — Explicitly Separated

FlowPilot demonstrates two enterprise AI patterns that serve different purposes and live in different repositories:

```
┌─────────────────────────────────────────────────────────┐
│              flowpilot-rag-service  (port 8000)          │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ Ingest   │  │   Qdrant    │  │  Grounding         │  │
│  │ PDF →    │→ │ dense+sparse│→ │  Pipeline          │  │
│  │ chunk →  │  │ hybrid RRF  │  │  + AI Guardrails   │  │
│  │ embed    │  │  retrieval  │  │  (cite or block)   │  │
│  └──────────┘  └─────────────┘  └────────────────────┘  │
│  Stateless · Domain-agnostic · Reusable across domains   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST /query (Bearer token)
                        ▼
┌─────────────────────────────────────────────────────────┐
│         flowpilot-vendor-onboarding  (port 8001)         │
│                                                          │
│   collect_vendor_info                                    │
│         │                                               │
│         ▼                                               │
│   retrieve_policies ──► calls RAG service               │
│         │                                               │
│         ▼                                               │
│   assess_risk       ──► OpenAI security analysis        │
│         │                                               │
│         ▼                                               │
│   request_approval  ──► HITL GATE (agent pauses)        │
│         │               human decision required         │
│         ▼                                               │
│   complete          ──► audit events written            │
│                                                          │
│  Stateful · LangGraph · SQLite state · 11 audit events  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              flowpilot-ui  (port 3000)                   │
│  React 18 · Vite · Tailwind · Keycloak OIDC              │
│  9 scenes · Role-aware · Real-time audit trail           │
└─────────────────────────────────────────────────────────┘
```

### Architecture Diagrams

**FlowPilot Assistance & Retrieval Architecture** — Phase 1 (retrieval) and Phase 2 (grounding + explanation):

![FlowPilot Assistance & Retrieval Architecture](docs/images/fig1-architecture.png)

**Stack to Repository Mapping** — how components distribute across repositories, where LangGraph is introduced, and how the vendor onboarding service calls the RAG service:

![FlowPilot Stack to Repository Mapping](docs/images/fig2-repo-mapping.png)

---

## Traceability — Every AI Decision Is Reconstructable

Every request through FlowPilot carries a `trace_id` generated at the API boundary. This trace ID propagates across all service calls, log entries, and audit events — enabling full reconstruction of any AI-assisted decision.

### Trace Flow

```
User Request
    │
    ├── trace_id: "a3f8-..." generated at API gateway
    │
    ├── RAG Service: POST /query
    │   ├── trace_id propagated in X-Trace-ID header
    │   ├── rag.query.initiated   { trace_id, query, timestamp }
    │   └── rag.query.completed   { trace_id, avg_score, confidence_met, results_count, latency_ms }
    │
    ├── Vendor Onboarding Agent: LangGraph nodes
    │   ├── workflow.created      { trace_id, workflow_id, requester, vendor_name }
    │   ├── security.analysis.started   { trace_id, workflow_id }
    │   ├── security.findings.generated { trace_id, risk_level, findings }
    │   ├── workflow.routed       { trace_id, approver_role }
    │   ├── approval.decision.submitted { trace_id, decision, approver }
    │   └── workflow.completed    { trace_id, outcome }
    │
    └── Audit Trail: GET /workflows/{id}/events
        └── Returns all 11 event types correlated by trace_id
```

### Structured Log Example

Every log line is a machine-readable JSON object:

```json
{
  "event": "rag.query.completed",
  "trace_id": "a3f8-4c21-9b7d",
  "workflow_id": "5aa79244-f8c9-4c8f",
  "service": "flowpilot-rag-service",
  "query": "cloud vendor data access controls ISO 27001",
  "strategy": "hybrid",
  "results_count": 5,
  "avg_score": 0.812,
  "confidence_met": true,
  "latency_ms": 342,
  "timestamp": "2026-05-18T08:30:45Z",
  "level": "info"
}
```

---

## Retrieval Scoring & Confidence

The RAG service returns verifiable quality metrics with every retrieval operation. These metrics are visible in the UI audit trail and in the structured log.

| Metric | What it means | Target |
|---|---|---|
| `avg_score` | Average similarity score of retrieved chunks (0–1) | > 0.65 |
| `confidence_met` | Whether avg_score exceeded the confidence threshold | `true` |
| `results_count` | Number of chunks returned (top-k) | 5 |
| `latency_ms` | Total retrieval + LLM grounding time | < 3000ms |
| `strategy` | Retrieval mode used | `hybrid` |

**Why this matters:** Without scoring, you cannot tell whether the AI's answer was grounded in relevant content or not. The confidence threshold gate (default 0.65) blocks the agentic workflow from continuing if retrieval quality is insufficient — the agent suspends and requests human clarification rather than proceeding on uncertain grounding.

### Hybrid Retrieval — Why Not Dense-Only

Early testing showed that dense-only search ranked semantically fluent chunks above chunks containing exact regulatory identifiers. A policy chunk mentioning "data protection obligations" outranked a chunk containing the exact clause "GDPR Article 28(3)" when queried with the clause reference.

**Decision:** Hybrid retrieval — OpenAI dense embeddings fused with Qdrant sparse vectors via Reciprocal Rank Fusion (weights: 0.7 dense / 0.3 sparse). Documented in ADR-002.

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

## Authentication

Keycloak 24 OIDC with role-based access control:

| User | Role | Access |
|---|---|---|
| `sarah.chen` | `procurement_manager` | Submit vendor onboarding requests |
| `michael.davidson` | `security_approver` | Review and approve/reject in approval queue |

Both backend services validate JWTs via Keycloak JWKS endpoint. Role extraction filters Keycloak system roles (`offline_access`, `uma_authorization`) before applying business role permissions. Documented in ADR-012.

---

## Architecture Decision Records

12 ADRs — each with context, decision, alternatives considered, and explicitly accepted tradeoff.

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
| **v1.0-final** | 11 ADRs, C4 diagrams, governance model, sequence diagrams |
| **v0.3-iteration-2** | Resilience: retry, dead-letter, degraded mode, idempotency, confidence threshold |
| **v0.2-iteration-1** | Agentic AI: LangGraph 5-node state machine, HITL approval gate |
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
# Terminal 1 — RAG service + Keycloak + Qdrant
cd flowpilot-rag-service
docker compose up

# Terminal 2 — Vendor onboarding agent
cd flowpilot-vendor-onboarding
docker compose up

# Terminal 3 — React UI
cd flowpilot-ui
npm run dev
# → http://localhost:3000
```

**Login credentials:**
- `sarah.chen` / `FlowPilot2026!` — procurement_manager
- `michael.davidson` / `FlowPilot2026!` — security_approver

**No OpenAI key required** — `FP_MOCK_MODE=true` runs the full workflow with realistic mock responses. Full architecture, workflow, observability, and resilience are demonstrable without any API cost.

---

*FlowPilot · NSCS B.V. · Built by Nitindra Soekhai · May 2026*
