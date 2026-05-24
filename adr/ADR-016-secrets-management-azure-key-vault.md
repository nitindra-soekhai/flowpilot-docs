# ADR-016 — Secrets Management: Azure Key Vault via Managed Identity

**Status:** Accepted — May 2026

**Layer:** 🟢 Shared — all services
> Secrets management is a cross-cutting infrastructure concern. Every service that reads a secret at runtime is affected by this decision.

**Author:** Nitindra Soekhai, NSCS B.V.
**Relates to:** ADR-012 (Keycloak as Identity Provider), ADR-014 (Azure Service Bus ingestion queue)

---

## Context

FlowPilot has four categories of runtime secret:

| Secret | Consumer | Local dev value |
|--------|----------|-----------------|
| `FP_OPENAI_API_KEY` | flowpilot-rag-service | `.env` |
| `JWT_SECRET` | flowpilot-rag-service, flowpilot-vendor-onboarding | `.env` |
| `KEYCLOAK_CLIENT_SECRET` | flowpilot-vendor-onboarding (M2M, RFC 6749 §4.4) | `.env` (written by `setup-m2m-client.ps1`) |
| `KEYCLOAK_ADMIN_PASSWORD` | provisioning scripts only | hardcoded Docker default `admin` |

In local development these values live in `.env` files that are gitignored and never committed. This is intentional and correct for the portfolio scope. The question this ADR answers is: **what is the production injection mechanism, and how does secret rotation work?**

Two additional constraints shape the decision:

1. The platform is committed to Azure (Container Apps, Service Bus — ADR-014), so the secret store must be Azure-native.
2. `KEYCLOAK_ISSUER` carries a value (`http://localhost:8080/realms/flowpilot`) that is specific to local development. When Keycloak moves to Azure, `KEYCLOAK_ISSUER` must be updated to the Azure-hosted URL. This is a configuration value that changes per environment, not a secret — but it is documented here because past incidents (I-09) show it is the most dangerous value to get wrong.

---

## Decision

**Azure Key Vault, accessed by Container Apps via system-assigned Managed Identity. No credentials in code or configuration files.**

### Vault structure

Vault name: `flowpilot-kv` · Resource group: `flowpilot-rg`

| Key Vault secret name | Environment variable | Consumer |
|-----------------------|---------------------|----------|
| `flowpilot-openai-api-key` | `FP_OPENAI_API_KEY` | flowpilot-rag-service |
| `flowpilot-jwt-secret` | `JWT_SECRET` | rag-service, vendor-onboarding |
| `flowpilot-keycloak-admin-password` | `KEYCLOAK_ADMIN_PASSWORD` | provisioning scripts (CI only) |
| `flowpilot-db-connection-string` | `DATABASE_PATH` | vendor-onboarding (future PostgreSQL) |
| `flowpilot-keycloak-client-secret-vendor-onboarding` | `KEYCLOAK_CLIENT_SECRET` | flowpilot-vendor-onboarding |

### Injection pattern (Azure Container Apps)

Each Container App is assigned a system-assigned Managed Identity. The identity is granted **Key Vault Secrets User** on `flowpilot-kv`. Secrets are referenced in the Container App environment configuration as Key Vault references:

```
secretref: keyvault(https://flowpilot-kv.vault.azure.net/secrets/flowpilot-openai-api-key)
```

The secret value is injected as an environment variable at container start. The application code reads `os.getenv("FP_OPENAI_API_KEY")` — no Azure SDK required in application code, no credentials to rotate on the application side.

### CI/CD (GitHub Actions)

Provisioning scripts that need `KEYCLOAK_ADMIN_PASSWORD` read it from a GitHub Actions secret, which is populated once from Key Vault by an operator. The script never runs inside the container — it is a one-time setup tool.

---

## Alternatives Considered

**Secrets Store CSI Driver (AKS)**
The CSI driver mounts Key Vault secrets as files or environment variables in Kubernetes pods. Rejected because the deployment target is Azure Container Apps, not AKS. The CSI driver requires a Kubernetes cluster. Introducing AKS solely for secret injection would add a substantial managed cluster cost and operational surface (node pools, upgrades, networking) without any application benefit. If the platform migrates to AKS in future, the CSI driver becomes the natural choice and this ADR should be revisited.

**Environment variables set directly in Container App configuration (plaintext)**
Container App environment variables can be set as plaintext in the ARM template or portal. Rejected because secrets written into ARM templates or portal configuration are stored in Azure Resource Manager state, which is visible to anyone with Reader access on the resource group. Key Vault references are opaque in ARM state — the reference string is stored, not the value.

**Azure App Configuration**
A managed key-value store with feature flag support. Rejected for secrets because App Configuration is not a secrets store — values are stored encrypted but the access model is designed for configuration, not secrets. Key Vault is the Azure-designated secrets plane; App Configuration can reference Key Vault for sensitive values, making it an optional complementary layer (for non-secret config) rather than a replacement.

**HashiCorp Vault**
A capable, cloud-agnostic secrets manager with dynamic secret generation. Rejected because it requires a self-hosted cluster (or HCP Vault, a paid managed offering). FlowPilot is already committed to Azure-managed services; running a separate secrets infrastructure introduces an additional stateful system with its own HA, backup, and upgrade responsibilities. Azure Key Vault delivers equivalent functionality as a fully managed Azure service.

**Application-level secret fetch (Azure SDK in service code)**
Services could use the Azure Identity + Key Vault SDK to fetch secrets at startup rather than relying on Container App injection. Rejected because it couples application code to the Azure SDK, requiring credentials (Managed Identity configuration) in the application itself. The Container App injection pattern keeps the application code credential-free and portable — the same container image runs locally against `.env` and in Azure against Key Vault without code changes.

---

## Accepted Tradeoff

Azure Key Vault is a cloud-specific dependency and a lock-in point. The two-path model (`.env` for local, Key Vault for Azure) must be maintained: any new secret introduced in code must have both a `.env.example` placeholder and a corresponding Key Vault secret name documented in this ADR and in the `azure-key-vault` skill.

Secret rotation causes a brief window where cached values in running containers are stale. For `KEYCLOAK_CLIENT_SECRET` specifically, the 401-retry in `rag_client.py` handles the transition: if the cached token was issued against the old secret, the first RAG call after rotation returns 401, `invalidate_cache()` is called, and a fresh token is fetched with the new secret on the retry. No requests are dropped; at most one request per running instance retries once. For other secrets (`FP_OPENAI_API_KEY`, `JWT_SECRET`), rotation requires a Container App revision restart to pick up the new value — plan rotation during low-traffic windows.

The Managed Identity approach means there are no long-lived credentials to rotate for the Key Vault access itself, which is the primary operational benefit.

---

## KEYCLOAK_ISSUER — environment-specific note

`KEYCLOAK_ISSUER` is not a secret, but it is the single most dangerous misconfiguration in this platform (it caused issue I-09 and is protected in the `azure-key-vault` skill). For clarity:

- **Local dev:** `http://localhost:8080/realms/flowpilot` — required because Keycloak issues JWT `iss` claims using the browser-visible address, not the Docker-internal hostname.
- **Azure deployment:** must be updated to the Azure-hosted Keycloak URL (e.g. `https://keycloak.flowpilot.example.com/realms/flowpilot`). The backend validates `iss` against this value; a mismatch causes all JWT validation to fail with `invalid_token`.
- This value should be managed as a Container App environment variable per deployment environment, not stored in Key Vault (it is not a secret). It belongs in the ARM template or Bicep parameter file for each environment.

---

## Consequences

**Positive:**
- No credentials in code, ARM templates, or container configuration.
- Managed Identity eliminates credential rotation for the Key Vault access path itself.
- Secret values are never visible in Azure Resource Manager state.
- Local dev path (`.env`) and Azure path (Key Vault injection) require no application code changes between environments.

**Negative:**
- Two-path secret model must be maintained: every new secret needs both a `.env.example` entry and a Key Vault secret name.
- Rotation of most secrets requires a Container App revision restart (planned maintenance window).
- Azure lock-in: the injection mechanism is Container Apps-specific. A move to a non-Azure host requires a different injection strategy.
- `KEYCLOAK_ISSUER` must be manually updated per environment — it is the one config value that cannot be shared between local dev and Azure.

---

*FlowPilot · NSCS B.V. · ADR-016 · May 2026*
