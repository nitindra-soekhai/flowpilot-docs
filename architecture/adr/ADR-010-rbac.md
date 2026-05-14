# ADR-010 — JWT-based RBAC enforced at platform middleware layer

## Status
Accepted

## Date
2026-05-14

## Context

FlowPilot handles vendor onboarding across multiple roles with materially different access requirements. Two services handle different workflow concerns (`flowpilot-rag-service`, `flowpilot-vendor-onboarding`). LangGraph agents execute tool calls on behalf of authenticated users.

Without a shared enforcement layer:
- Each service would reimplement access control independently, creating drift and inconsistency risk
- There would be no mechanism to bound an agent's capabilities to the initiating user's permissions

ADR-009 states: *"an agent cannot exceed the permissions of the user who triggered it."* RBAC is the mechanism that enforces this invariant.

## Decision

JWT-based RBAC is enforced at the platform middleware layer (`flowpilot-platform`) as a shared Python library imported by all services. The middleware:

1. Decodes the incoming JWT and extracts the `roles` claim
2. Evaluates the requested route against the role-permission matrix
3. Returns `403 Forbidden` immediately on denial — writes actor, route, and timestamp to audit log
4. On success, attaches `user_context` (user ID, roles, trace ID) to the request
5. LangGraph agent receives `user_context` in its state graph; every tool node validates permissions before executing

## Alternatives considered

| Alternative | Reason rejected |
|---|---|
| Per-service RBAC | Duplicates logic; inconsistency risk across services |
| API gateway RBAC (e.g. Kong) | Correct but adds infrastructure not justified at portfolio scope |
| No RBAC for portfolio | Unacceptable — enterprise AI platform demo must demonstrate access governance |

## Accepted tradeoff

Token issuance is stubbed with hardcoded JWTs per test persona. Production deployment integrates with Azure AD or equivalent identity provider. The design is production-correct; the token issuer is simplified.

## Consequences

- RBAC logic lives in one file: `flowpilot-platform/middleware/rbac.py`
- Every `403` is automatically written to the audit log
- AI agent tool calls are bounded by the initiating user's permissions — privilege escalation via the agent is structurally impossible
- Adding a new role requires updating the matrix in one place only
- Integration tests run without an auth server using hardcoded JWTs
