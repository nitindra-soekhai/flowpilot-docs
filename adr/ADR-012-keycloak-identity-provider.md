# ADR-012 — Keycloak as Identity Provider

**Status:** Accepted — May 2026

**Layer:** 🟢 Shared — RAG + Agentic AI
> Both backend services (RAG and Agentic AI) validate Keycloak JWTs via the JWKS endpoint. Role-based access controls which workflow actions the agentic layer may execute and which queries the RAG service will serve.
**Author:** Nitindra Soekhai, NSCS B.V.
**Supersedes:** Portfolio HS256 hardcoded JWT tokens (ADR-010 partial)

---

## Context

The portfolio UI requires enterprise-realistic authentication. The existing RBAC
implementation (ADR-010) uses hardcoded HS256 JWT tokens suitable for API-level
testing and Claude Code unit test bypass (FP_MOCK_MODE), but not for a realistic
user-facing application where a hiring audience can observe the complete OIDC flow.

The authentication layer must satisfy three constraints:

1. **Enterprise realism** — OIDC Authorization Code flow with a proper identity provider,
   not a demo-only token generator
2. **Self-contained** — no dependency on external tenants (Entra ID, Auth0) that a
   reviewer cannot reproduce without account setup
3. **Role-aware** — roles must flow from the identity provider into both backend
   services via JWT claims, matching the existing RBAC role matrix

The technology choice must be reproducible by any reviewer with Docker installed.

---

## Decision

**Keycloak 24** running as a Docker service on port 8080, integrated via OIDC
Authorization Code flow.

Configuration:
- Realm: `flowpilot`
- Client: `flowpilot-ui` (public OIDC, no client secret, redirect to `localhost:3000/*`)
- Roles: `procurement_manager`, `security_approver`, `compliance_reviewer`, `admin`
- Demo users: `sarah.chen` (procurement_manager), `michael.davidson` (security_approver)

Both backend services validate JWTs via the Keycloak JWKS endpoint:
`http://keycloak:8080/realms/flowpilot/protocol/openid-connect/certs`

Role is extracted from the `realm_access.roles` claim in the Keycloak-issued JWT —
the same role names used in the existing RBAC model, no mapping layer required.

The React UI uses the official `keycloak-js` adapter. Bearer tokens are attached to
all API calls. The role-aware UI (VendorForm restricted to `procurement_manager`,
ApprovalQueue restricted to `security_approver`) is enforced at the React component
level in addition to the backend middleware check.

The single LandingScene at `/` exposes two CTAs ("Start vendor onboarding",
"Go to approval queue") that call `keycloak.login({ redirectUri })` when the user
is unauthenticated, so the post-login redirect lands the user directly on the
target route instead of bouncing through an intermediate intro page.

`FP_MOCK_MODE=true` continues to bypass JWKS validation entirely in both backends,
preserving the zero-friction unit test path.

---

## Alternatives Considered

### Entra ID (Microsoft) OIDC

**Why considered:** The most realistic enterprise choice. Most large enterprises use
Microsoft Entra ID (formerly Azure AD) as their identity provider. A portfolio
demonstrating Entra ID integration signals direct production relevance.

**Why rejected:** Requires an Azure tenant and an Entra ID app registration. A reviewer
without an Azure subscription cannot reproduce the setup. Creates an external dependency
that cannot be bundled with the portfolio. The authentication competency being
demonstrated — OIDC Authorization Code flow, JWKS validation, JWT role claims — is
identical regardless of which OIDC-compliant provider is used.

**Documented upgrade path:** Replacing Keycloak with Entra ID requires changing
`KEYCLOAK_JWKS_URL` and `KEYCLOAK_ISSUER` env vars to Entra ID equivalents, and
replacing `realm_access.roles` claim extraction with `roles` (app roles) or group
membership. No application logic changes required.

### Auth0 Free Tier

**Why considered:** Managed OIDC service, no self-hosting, well-documented.
Lower setup overhead than Keycloak. Free tier is publicly available.

**Why rejected:** External dependency. Auth0 free tier is subject to rate limits,
tenant expiry, and Auth0's service availability — none of which are under portfolio
control. A reviewer cloning the repo and running `docker-compose up` would need to
create and configure an Auth0 tenant separately. Self-hosted Keycloak starts with a
single `docker-compose up`.

### Hardcoded JWT Tokens Only (No UI Change)

**Why considered:** FP_MOCK_MODE with HS256 tokens already works for API testing.
No additional complexity.

**Why rejected:** Hardcoded tokens are not a realistic user-facing authentication flow.
A portfolio claiming enterprise AI architecture competence must demonstrate that it
understands and can implement the OIDC flow that every enterprise application uses.
A procurement manager does not run `curl -H "Authorization: Bearer eyJ..."`.

---

## Accepted Tradeoff

Keycloak requires manual realm configuration after `docker-compose up`. The realm,
roles, users, and client cannot be fully provisioned via docker-compose alone without
importing a realm JSON (which would be the production approach).

For portfolio scope, the manual configuration is documented step-by-step in the Day 5
build plan and takes approximately 15 minutes. In a production deployment, an enterprise
organisation would use their existing Entra ID or Okta tenant rather than self-hosted
Keycloak. This is explicitly a portfolio-scoped decision: Keycloak avoids Azure tenant
dependency while demonstrating all the relevant OIDC competencies.

A realm export (`flowpilot-realm.json`) should be committed to the flowpilot-docs repo
after initial setup, enabling `docker-compose up` with automatic realm import in future
runs — the production-realistic approach documented as a follow-on step.

---

## Consequences

**Positive:**
- Full OIDC Authorization Code flow visible to any reviewer with Docker
- JWT role claims flow from identity provider to both backend services
- Role-aware React UI enforces RBAC at the presentation layer
- FP_MOCK_MODE unit test path unaffected

**Negative:**
- One additional Docker service in the compose stack (Keycloak adds ~600MB RAM)
- Manual realm configuration required on first run
- Keycloak is not an enterprise default; reviewers from Microsoft-centric enterprises
  may note the deviation from Entra ID

---

*FlowPilot · NSCS B.V. · ADR-012 · May 2026*
