# Domain Boundaries

> How `flowpilot-platform` remains decoupled from the vendor onboarding domain, and why this matters architecturally.

---

## The Boundary Problem

A common failure mode in enterprise AI platform design is allowing domain logic to leak into the platform layer. When this happens, the platform becomes a collection of vendor-onboarding-specific utilities rather than a reusable foundation. Adding a second domain (HR onboarding, procurement, contract management) then requires platform changes — defeating the purpose of having a platform.

FlowPilot enforces explicit domain boundaries at every layer.

---

## Boundary Map

```
┌─────────────────────────────────────────────────────────────────┐
│  flowpilot-platform  (domain-agnostic)                          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ RBAC        │  │ Audit Logger │  │ HITL Interface       │  │
│  │ role/perms  │  │ event schema │  │ approval hooks       │  │
│  │ JWT decode  │  │ trace_id req │  │ timeout handling     │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐                            │
│  │ Retry       │  │ Dead Letter  │                            │
│  │ decorator   │  │ store        │                            │
│  └─────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
         │ consumes via interface only │
         ▼                             ▼
┌──────────────────────┐   ┌──────────────────────────────────────┐
│ flowpilot-rag-service│   │ flowpilot-vendor-onboarding          │
│ (domain-agnostic)    │   │ (vendor onboarding domain)           │
│                      │   │                                      │
│ No knowledge of:     │   │ Contains:                            │
│ - vendors            │   │ - VendorOnboardingState              │
│ - workflows          │   │ - REQUIRED_DOCS per vendor type      │
│ - approvals          │   │ - security_review mock findings      │
│ - onboarding steps   │   │ - onboarding business rules          │
│                      │   │ - procurement_manager role logic     │
└──────────────────────┘   └──────────────────────────────────────┘
```

---

## What belongs where

### Platform layer — flowpilot-platform
Things that are true for **every** domain:

| Capability | Why it belongs in platform |
|-----------|---------------------------|
| JWT decode + RBAC | Every domain needs auth. Role/permission mapping is business-configurable, not domain-specific. |
| Audit event schema | Compliance requires consistent audit fields across all domains. A domain that defines its own audit schema creates an ungovernable audit trail. |
| Retry decorator | The retry policy (3 attempts, 500ms initial, multiplier 2, jitter) is an operational decision, not a domain decision. It should be configurable centrally. |
| Dead-letter store | Failed steps in any domain need reprocessing. The store schema is domain-agnostic: service, step_name, payload_json, error, trace_id. |
| HITL interface | Human approval is required in multiple domains. The interface (request, response, timeout, escalation) is the same regardless of what is being approved. |

### Domain layer — flowpilot-vendor-onboarding
Things that are specific to **vendor onboarding**:

| Capability | Why it belongs in domain |
|-----------|--------------------------|
| `REQUIRED_DOCS` per vendor type | Which documents a cloud vs SaaS vendor must submit is a domain business rule. |
| Security findings generation | The mock security findings reference vendor onboarding concepts (SOC 2, DPA, CISO sign-off). |
| Workflow states | `INITIATED → DOCUMENTS_COLLECTED → SECURITY_REVIEW → PENDING_APPROVAL → APPROVED/REJECTED` is the vendor onboarding state machine, not a generic pattern. |
| `VendorOnboardingState` TypedDict | The fields (vendor_name, vendor_type, requested_access_level) are domain concepts. |

### Domain-agnostic retrieval — flowpilot-rag-service
The RAG service has zero knowledge of vendors, workflows, or approvals. It answers questions. The question happens to be about vendor onboarding policy — but the service does not know that. This means:

- A future HR domain can use the same RAG service with different policy documents
- Retrieval quality improvements benefit all domains simultaneously
- The RAG service can be independently scaled, versioned, and tested

---

## The test for a good boundary

> *If adding a second domain (e.g. HR onboarding) requires changes to flowpilot-rag-service or flowpilot-platform, the boundary is wrong.*

Current state: adding an HR onboarding domain requires:
1. A new `flowpilot-hr-onboarding` service (new domain, expected)
2. Ingesting HR policy documents into the RAG service (data change, no code change)
3. Configuring new roles in the RBAC role map (config change, no code change)

No changes required in `flowpilot-rag-service` or `flowpilot-platform`. The boundary is correct.

---

## Known boundary violations (accepted with rationale)

### 1. `degraded=True` field in WorkflowResponse
The `degraded` flag is technically a platform-level operational concept (RAG service unavailability) surfacing in a domain response model. In a production platform, this would be a platform-level response envelope field. For portfolio scope, it is in the domain response model for simplicity. Documented as a known violation — not hidden.

### 2. SQLite in both services
Both services use SQLite independently. A production platform would use a shared audit database or a platform-level audit event bus. For portfolio scope, each service owns its own SQLite file. The schemas are consistent by convention, not by enforcement.


---

## Scope Simplification: Single Security Approver

The FlowPilot functional specification defines five approval domains (procurement, security, legal, compliance, operational). The portfolio implementation collapses these into a single `security_approver` gate.

This is explicitly a scope simplification. The multi-approver production design is documented in the [governance model](../governance/governance-model.md). The domain boundary this creates: all approval logic is in `flowpilot-vendor-onboarding`; the platform HITL interface (flowpilot-platform) is designed to support N gates without modification.
