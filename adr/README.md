# Architecture Decision Records

All ADRs follow the same structure: **Context → Decision → Alternatives Considered → Accepted Tradeoff**.

> An ADR without a stated tradeoff is not an ADR — it is a justification. Every ADR here names at least two alternatives, states the specific constraint that ruled them out, and explicitly acknowledges the accepted downside.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-qdrant-over-pgvector.md) | Qdrant over PostgreSQL pgvector | Accepted |
| [ADR-002](./ADR-002-hybrid-retrieval.md) | Hybrid retrieval over dense-only | Accepted |
| [ADR-003](./ADR-003-langgraph-domain-only.md) | LangGraph restricted to domain layer | Accepted |
| [ADR-004](./ADR-004-hitl-platform-concern.md) | HITL as platform-level concern | Accepted |
| [ADR-005](./ADR-005-sqlite-workflow-state.md) | SQLite for workflow state | Accepted — revisit at production scope |
| [ADR-006](./ADR-006-fastapi-over-spring-boot.md) | FastAPI over Spring Boot | Accepted — portfolio-scoped |
| [ADR-007](./ADR-007-retrieval-separated-from-orchestration.md) | Retrieval service separated from orchestration | Accepted |
| [ADR-008](./ADR-008-vendor-onboarding-domain.md) | Vendor onboarding as demonstration domain | Accepted |
| [ADR-009](./ADR-009-mock-mode.md) | Mock mode for zero-friction demonstration | Accepted |
| [ADR-010](./ADR-010-structlog-json-logging.md) | Structured JSON logging over traditional logging | Accepted |
| [ADR-011](./ADR-011-reranking-layer.md) | No dedicated reranking layer at portfolio scope | Accepted — revisit at production scale |
| [ADR-012](./ADR-012-keycloak-identity-provider.md) | Keycloak as Identity Provider | Accepted |
| [ADR-013](./ADR-013-event-feed-polling-over-sse.md) | Event Feed Implementation: UI Polling over SSE | Accepted |
| [ADR-014](./ADR-014-azure-service-bus-ingestion-queue.md) | Azure Service Bus as Async Ingestion Queue | Accepted — production path |
| [ADR-015](./ADR-015-langgraph-state-machine-over-multi-agent.md) | LangGraph State Machine over Autonomous Multi-Agent Orchestration | Accepted |
