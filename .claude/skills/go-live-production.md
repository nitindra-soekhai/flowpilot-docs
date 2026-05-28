# Skill: Go-Live Production
# Applied to ALL repos — no exceptions
# NSCS B.V. · Production Transition Standard

## Purpose
This skill documents every decision, swap, and step required to transition FlowPilot from its demo environment to Azure production. Any engineer should be able to execute a go-live using only this document.

---

## Adapter swaps (per ADR-018)

Each swap is a single file change. Domain logic does not change.

| Component | Demo | Production | Effort |
|-----------|------|------------|--------|
| Job queue | SQLite JobQueueRepository | Azure Service Bus adapter | 1 day |
| Document scanner | MockDocumentScanner / OPSWAT Cloud | OPSWAT Core on-prem or Defender for Storage | 1–2 days |
| Document store | LocalFilesystemDocumentStore | AzureBlobDocumentStore | 1 day |
| Notifications | SQLiteNotificationService | Azure Communication Services adapter | 1 day |
| Secrets | .env SecretsProvider | Azure Key Vault adapter (ADR-016) | 0.5 day |
| Audit log | SQLite | Azure Table Storage or Log Analytics | 1 day |
| Workflow state | SQLite | Azure SQL or Cosmos DB | 2–3 days |

---

## Identity — highest risk item

Identity is always the longest item. Do not underestimate it.

**Option A — Keep Keycloak**
- Deploy on AKS with persistent volume and HA configuration
- Requires: OIDC client reconfiguration, user migration, token claim mapping

**Option B — Migrate to Azure Entra ID External** (formerly AD B2C)
- Requires: OIDC client reconfiguration, user migration, token claim mapping

Both options require a minimum of **1 week** regardless of which is chosen. Budget accordingly before any sprint planning.

---

## Azure infrastructure checklist

Provision in this order. Do not skip items.

- [ ] Azure subscription + resource group
- [ ] Azure Container Registry (ACR) — push all Docker images
- [ ] Azure Kubernetes Service (AKS) — deploy all services
- [ ] Azure Service Bus namespace + queues/topics
- [ ] Azure Blob Storage account + containers
- [ ] Azure Key Vault — migrate all secrets from .env
- [ ] Azure Communication Services — for email notifications (v2)
- [ ] Microsoft Defender for Storage — enable on Blob account on day 1
- [ ] Azure Monitor + Application Insights + Log Analytics workspace
- [ ] Azure DNS + custom domain + TLS certificate (Let's Encrypt or Azure)
- [ ] Virtual Network + subnets + Network Security Groups
- [ ] Private endpoints for Key Vault, Service Bus, Blob — no public IPs
- [ ] Managed identities for all services — no connection strings

---

## OpenAI → Azure OpenAI

- Request quota in the target Azure region **before** you need it — lead time is days to weeks depending on model and region
- Models to verify: `gpt-4o`, `text-embedding-3-small` — confirm regional availability before provisioning
- Swap requires only two Key Vault values: `OPENAI_API_BASE` and `OPENAI_API_KEY`
- No code change needed — the existing adapter pattern handles this

---

## CI/CD

- Pipeline: GitHub Actions → ACR push → AKS rolling deploy
- Environments: dev / staging / prod — separated, never share secrets
- Secrets via GitHub OIDC → Azure — no stored credentials in GitHub
- All services must have health checks and readiness probes before go-live
- Rollback command: `kubectl rollout undo deployment/{service}` — document and rehearse before go-live day

---

## Data migration

| Dataset | From | To | Notes |
|---------|------|----|-------|
| Qdrant collections | Local Qdrant | Production Qdrant | Export → import |
| Workflow state | SQLite | Azure SQL | Alembic migration |
| Audit log | SQLite | Azure Table Storage | Import history or accept clean start |
| Keycloak users | Local realm | Production Keycloak or Entra ID | Realm export → import |

---

## Security hardening

All items must be in place before go-live. Not after.

- No public IPs on any service — ingress controller only
- All inter-service traffic via private VNet
- Managed identities everywhere — no connection strings in config
- Key Vault access policies: least privilege per service
- Network Security Groups: deny all by default, allow explicit only
- Defender for Storage: enabled on day 1

---

## Smoke test checklist

Run after every deployment — staging and production.

- [ ] Health endpoints all green: `/health` on all services
- [ ] Keycloak login works for all 3 demo users
- [ ] Vendor onboarding workflow: submit → approve → complete
- [ ] Document upload: PDF upload → scan CLEAN → ingestion COMPLETE
- [ ] RAG query returns a grounded answer
- [ ] Audit log records events
- [ ] Notification bell shows events

---

## Rollback plan

| Layer | Command / Action |
|-------|-----------------|
| AKS service | `kubectl rollout undo deployment/{service}` |
| Database | Restore from last Azure SQL automated backup |
| Qdrant | Restore from snapshot |
| DNS | TTL 60s on go-live day — change A record to old IP for instant rollback |

**Decision authority:** Nitindra (NSCS B.V.) — no rollback without explicit approval.

---

## Timeline estimate — single developer

| Phase | Duration |
|-------|----------|
| Adapter swaps | 1 week |
| Identity (Keycloak on AKS or Entra ID) | 1 week |
| Azure infra provisioning + CI/CD | 1 week |
| Security hardening + private endpoints | 3–5 days |
| Testing + smoke tests + rollback rehearsal | 3–5 days |
| **Total** | **4–6 weeks** |

---

## What does NOT change

These items are stable across demo and production — do not modify them during a go-live.

- All domain logic (LangGraph nodes, HITL flow, guardrails)
- All ADRs — decisions hold in production
- All API contracts — no breaking changes
- Keycloak OIDC claims — same JWT structure
