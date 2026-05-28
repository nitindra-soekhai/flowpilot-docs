# ADR-018 — Demo-to-production adapter pattern for infrastructure components

**Status:** Accepted — May 2026  

**Layer:** 🟠 Shared
> Applies to all FlowPilot repos. Every infrastructure component (job queue, document scanner, document store, notifications, secrets) is built behind an abstract interface. Domain logic never references infrastructure concretely.  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

FlowPilot Day 9 adds an Admin Document Upload module requiring four new infrastructure components: a job queue for async ingestion, a document scanner for virus checking, a document store for uploaded files, and an internal notification system. Each has a natural demo implementation (SQLite, MOCK_MODE, local filesystem, SQLite bell) and a target production implementation (Azure Service Bus, Defender for Storage, Azure Blob, Azure Communication Services).

Without a governing pattern, these components risk being built with their implementation detail exposed directly to domain logic — making productionisation a rewrite, not a swap.

---

## Decision

**Every infrastructure component is built behind an abstract interface. Domain logic imports only the interface. The demo adapter is the simplest locally-runnable implementation. The production adapter is a swappable replacement that satisfies the same interface contract.**

```
Interface (permanent, never changes)
  ├── DemoAdapter     (SQLite / mock / local filesystem)
  └── ProductionAdapter (Azure Service Bus / Defender / Blob / ACS)
```

The interface is the deliverable — not the adapter. Domain code does not change when adapters are swapped. Dependency injection wires the correct adapter at startup via environment configuration.

**Adapter map:**

| Component | Interface | Demo | Production |
|-----------|-----------|------|------------|
| Job queue | `JobQueueRepository` | SQLite | Azure Service Bus |
| Document scanner | `DocumentScanner` | MOCK_MODE=true or OPSWAT API | Defender for Storage |
| Document store | `DocumentStore` | Local filesystem | Azure Blob Storage |
| Notifications | `NotificationService` | SQLite bell | Azure Communication Services |
| Secrets | `SecretsProvider` | .env file | Azure Key Vault (ADR-016) |

---

## Alternatives Considered

**Build production-grade from day one**  
Azure infra provisioning (Service Bus namespace, Blob container, ACS account, Managed Identity bindings) exceeds portfolio demo scope. Blocks local development until cloud resources are provisioned. Rejected: adds weeks of infrastructure setup before first document upload works locally.

**Build mock stubs without interfaces**  
Stubs wired directly to domain logic. Fast to write, but productionisation becomes a search-and-replace across all callers rather than a single adapter file swap. Rejected: creates rewrite cost, not adapter cost, on productionisation.

**Framework-level DI (FastAPI Depends, Python ABC + registry)**  
All valid implementation approaches for the interface pattern. Not an alternative — the pattern is the decision; the framework mechanism is an implementation detail left to the implementing agent.

---

## Accepted Tradeoff

Demo adapters are not suitable for multi-instance deployment. The SQLite job queue, local filesystem document store, and SQLite notification bell all assume single-process, single-host operation. This is explicitly acknowledged and acceptable at portfolio scope.

The interface contract is the architectural deliverable. Swapping any adapter requires: one new adapter file satisfying the interface, one environment variable change to select it, and no domain code changes.

---

## Testability

Demo adapters are deterministic and require no network access. All unit tests use demo adapters. Integration tests may use either. The interface contract is testable independently of any adapter: a shared adapter conformance test suite validates that any new adapter satisfies the interface before it is accepted.

Mock adapters must return deterministic outputs (fixed scan results, fixed notification payloads) to enable repeatable unit test assertions.
