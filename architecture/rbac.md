# RBAC — Role Matrix and Enforcement Architecture

## Role-permission matrix

| Role | assessment:create | assessment:read | assessment:approve | policy:upload | policy:read | audit:read | user:manage |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `admin` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `procurement_manager` | ✓ | ✓ | — | — | ✓ | — | — |
| `security_approver` | — | ✓ | ✓ | — | ✓ | — | — |
| `compliance_approver` | — | ✓ | ✓ | — | ✓ | — | — |
| `policy_manager` | — | ✓ | — | ✓ | ✓ | — | — |
| `viewer` | — | ✓ | — | — | ✓ | — | — |

## Resource-permission model

```
assessment:create     → procurement_manager, admin
assessment:read       → all authenticated roles
assessment:approve    → security_approver, compliance_approver, admin
policy:upload         → policy_manager, admin
policy:read           → all authenticated roles
workflow:manage       → admin
audit:read            → admin
user:manage           → admin
```

## Enforcement architecture

```mermaid
flowchart TD
    A["HTTP Request"] --> B

    subgraph MW ["flowpilot-platform · JWT Middleware"]
        B["Decode JWT RS256 via Keycloak JWKS · extract realm_access.roles\nskip system roles (offline_access etc.)"] --> C{"Permission check\nroute × role matrix"}
    end

    C -->|denied| D["403 Forbidden · immediate"]
    D --> E["Audit log\nactor · route · timestamp"]

    C -->|allowed| F["Attach user_context to request"]
    F --> G

    subgraph AG ["LangGraph Agent"]
        G["Agent inherits user_context"] --> H{"Tool call\npermission check"}
        H -->|exceeds user permissions| I["Tool call blocked\naudit event written"]
        H -->|within user permissions| J["Tool call executed"]
    end
```

## Implementation scope

| Component | Built | Stubbed |
|---|:---:|:---:|
| JWT middleware — decode and permission check | ✓ | |
| Role matrix enforced on all routes | ✓ | |
| Agent permission inheritance via user_context | ✓ | |
| Audit log on every 403 | ✓ | |
| User management UI | | ✓ |
| Keycloak OIDC login flow (Authorization Code) | ✓ | |

> Authentication: Keycloak 24 OIDC — Authorization Code flow for React UI, JWKS endpoint for JWT validation in both backend services. Users: sarah.chen (procurement_manager), michael.davidson (security_approver), lisa.vandenberg (policy_manager). Passwords managed via Keycloak realm import (flowpilot-realm.json). See ADR-012.
