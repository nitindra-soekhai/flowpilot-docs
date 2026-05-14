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
        B["Decode JWT · extract roles"] --> C{"Permission check\nroute × role matrix"}
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
| Token issuance and login flow | | ✓ |

> Hardcoded JWTs per test persona for portfolio scope. Production integrates with Azure AD.
