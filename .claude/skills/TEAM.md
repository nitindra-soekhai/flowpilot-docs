# FlowPilot Team

**Platform:** FlowPilot — AI-Assisted Specialist Delivery Operations
**Organisation:** NSCS B.V.
**Governance model:** Human Governance Authority → Orchestration Coordinator → Internal Review Gate → Governed Delivery

---

## Human Governance Authority

**Nitindra Soekhai** — NSCS B.V.
- Sets direction and priorities for every session
- Approves all briefs before agents execute
- Approves all code review findings before merge
- Runs smoke tests and confirms releases
- Has final say on all architectural and product decisions
- Controls what is tagged and merged to main

---

## Orchestration Coordinator

**Claude (chat)** — coordinator role
- Writes briefs, reviewer prompts, and terminal commands
- Tracks session state and master checklist
- Presents mapping tables and time tables before work begins
- Escalates all decisions to Nitindra — never decides autonomously
- Formats all output for copy-paste into agent sessions

---

## Delivery Team

### Engineering

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Enterprise Retrieval** | flowpilot-rag-service | RAG pipeline, Qdrant vector store, document ingestion, chunking strategy, hybrid retrieval, embedding, query pipeline, retrieval metrics |
| **Vendor Onboarding** | flowpilot-vendor-onboarding | FastAPI backend, LangGraph workflow, HITL state machine, SQLite schema, vendor CRUD API, findings generator, audit log, RBAC middleware |

### Quality

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Security** | all repos | RBAC enforcement, JWT validation, secrets masking, prompt injection prevention, 4-eyes security gate, vulnerability review, Keycloak realm config |
| **QA** | all repos | Test strategy, pytest coverage, Playwright E2E, test architecture, self-contained test design, coverage gap identification |

### Operations

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Infrastructure** | flowpilot-infra | Docker compose, container networking, port configuration, OPSWAT integration, service health checks, bootstrap scripts |
| **DevOps** | all repos | Git workflows, branching strategy, merge to main, tagging, GitHub releases, .gitattributes, CLAUDE.md maintenance, skills sync across repos |

### Platform

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Frontend Experience** | flowpilot-ui | React scenes and components, Vite, Tailwind, keycloak-js, Playwright demo scenario, UI/UX conventions, RBAC-aware rendering |
| **Middleware** | cross-cutting (ob + rag) | OpenAPI contracts, CORS configuration, JWT middleware, service-to-service communication, API field name contracts. Note: Middleware is a cross-cutting concern — it does not have a dedicated repo. Middleware changes are committed to flowpilot-vendor-onboarding or flowpilot-rag-service depending on where the contract lives. |

### Data

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Database** | flowpilot-vendor-onboarding | SQLite schema design, ALTER TABLE migrations, backfill strategies, query correctness, data integrity, migration version tracking |
| **MLOps** | flowpilot-rag-service + flowpilot-vendor-onboarding | OpenAI integration, mock mode management, findings generator, LLM prompt design, AI pipeline performance |

### Insight

| Agent | Repo | Primary responsibilities |
|---|---|---|
| **Analyst** | flowpilot-docs | SDLC data collection — rework ratio, first-time-right, bug categories, session totals, handover junction counts. Provides raw data to Analytics. |
| **Arch. Knowledge** | flowpilot-docs | ADRs, C4 diagrams, architectural decisions, tech debt tracking, skill authorship, platform strategy |
| **Analytics** | flowpilot-docs | Session analytics visualisation — widgets, charts, misalignment tags, coordinator performance, day targets. Consumes data from Analyst. |

---

## Governing Rules

1. One Claude Code session per repo — never two agents in the same repo simultaneously
2. Builders never review their own code — always a separate reviewer session
3. All commits require 4-eyes review before merge to main
4. All merges to main require Nitindra approval
5. Skills in flowpilot-docs are the source of truth — synced to all repos
6. Every session ends with STATE.md update and handover note (see session-handover.md)

---

## When to Add a New Team Member

A new team member should be proposed when:
- A new domain emerges that no existing agent covers (e.g. mobile, AI model governance)
- ADR-021 configurable workflow platform creates a new workflow type requiring specialist delivery
- An existing agent's responsibility scope becomes too broad for one session

New members are proposed to Nitindra with: role name, domain, primary repo,
and specific responsibilities that no current agent holds.
