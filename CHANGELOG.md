# Changelog

All notable changes to FlowPilot are documented here.

---

## v1.9-vendor-registry — Day 10

- Vendor CRUD API with full RBAC (GET/POST/PUT/DELETE /vendors)
- VendorOverviewScene: table, StatusBadge, DeleteVendorModal
- 5-act self-contained E2E demo scenario (SQLite seed, all passing)
- Workflow-progress redirect restored post vendor creation
- View Vendor Registry button in WorkflowProgressScene
- workflow_id in VendorResponse and PUT /vendors/{id} response
- 10 bugs fixed, all with E2E coverage
- 8 new governance skills deployed to all 5 repos: session-handover, session-management, code-review-protocol, e2e-test-architecture, coordinator-protocol, team-code-review-assignments, STATE-template, TEAM
- STATE.md created per repo, CLAUDE.md updated across all repos
- ADR-021 documented: configurable workflow schema

---

## v1.8-admin-module — Day 9

- Admin Document Upload module with async ingestion pipeline
- OPSWAT MetaDefender Cloud API for virus scanning (ADR-019)
- SQLite-backed internal notification bell; email deferred to v2 (ADR-020)
- Demo-to-production adapter pattern for all infrastructure components: job queue, document scanner, document store, notifications, secrets (ADR-018)
- go-live-production skill and new-role-checklist skill authored

---

## v1.6 — Day 6

- Real AI security findings: OpenAI structured outputs, Pydantic Finding model
- M2M Keycloak client fix for service-to-service JWT
- Startup orchestration improvements
- ADR-016 (Azure Key Vault), ADR-017 (polyrepo strategy)
- 17 ADRs total at release

---

## v1.5-operational-homepage

- FLOWPILOT OPERATIONAL control plane homepage
- 5-tile layout with live status indicators
- ADR-015: LangGraph state machine over autonomous multi-agent orchestration
- Platform positioning statement

---

## v1.4-dark-ui

- Dark RT token system across all UI scenes
- 6 scenes migrated to dark theme
- Build hook for token system
- NaN% guard for audit trail metrics

---

## v1.3-option-b-polling

- Live event polling (Option B — ADR-013)
- Security hardening: prompt injection mitigation, sandwich-pattern
- RAG service networking hardened (Docker bridge network isolation)
- ADR-013 documented

---

## v1.2-knowledge-base

- Async ingestion queue: Azure Service Bus (production) / BackgroundTasks (demo) — ADR-014
- Vendor registry: duplicate validation, re-assessment triggers
- Document Management scene
- 16 ADRs total at release

---

## v1.1-authentication-ui

- Keycloak 24 OIDC: Authorization Code flow, React UI
- 9-scene React UI
- Real audit trail: 11 structured event types
- ADR-012 documented

---

## v1.0-final

- Complete FlowPilot platform
- All ADRs (1–011) documented
- C4 diagrams (context, container, component)
- Governance model documented

---

## v0.3-iteration-2

- Operational resilience: retry, dead-letter, degraded mode
- AI governance layer
- Full observability

---

## v0.2-iteration-1

- Hybrid retrieval (dense + sparse, RRF)
- Agentic workflow (LangGraph 5-node state machine)
- HITL approval gate

---

## v0.1-mvp

- RAG service: hybrid retrieval, observability foundation, unit tests
