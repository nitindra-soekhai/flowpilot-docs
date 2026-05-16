# ADR-004 — HITL as Platform-Level Concern

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

Human-in-the-loop approval is required in the vendor onboarding workflow. The design question was whether to implement HITL as domain-specific logic (procurement managers approve vendors) or as a reusable platform capability (any domain can define approval gates).

This matters because enterprise AI platforms typically serve multiple domains that all require some form of human approval — vendor onboarding, contract approval, budget authorisation, data access grants. If HITL is implemented per-domain, every new domain reinvents the approval mechanism.

---

## Decision

**HITL hooks (approval request, response, timeout, escalation) are defined as platform-level interfaces in `flowpilot-platform`. Domain implementations call the platform HITL interface; they do not implement approval logic directly.**

In the current portfolio implementation, this is demonstrated through:
- RBAC enforcement at the API level (only `security_approver` role reaches the decisions endpoint)
- State guard in the router (only `PENDING_APPROVAL` workflows can receive a decision)
- The agent structurally cannot approve its own requests — it does not hold a `security_approver` token

---

## Alternatives Considered

**HITL implemented per-domain**  
Each domain implements its own approval mechanism. Simpler for the first domain. Rejected because it duplicates approval logic across every domain that needs it. In a 10-domain enterprise platform, this means 10 different approval implementations with inconsistent timeout handling, escalation paths, and audit schemas.

**External BPMN engine (Camunda, Flowable)**  
Purpose-built human task management with delegation, escalation, SLA tracking, and audit. Production-grade. Rejected because it adds significant infrastructure (Camunda requires its own service + database) beyond portfolio scope. The correct choice for a production system where approval workflows have complex delegation and SLA requirements.

**Temporal with human activity signals**  
Temporal's activity model supports long-running human approval waits via signals. More elegant than custom implementation. Rejected alongside Temporal generally (see ADR-003) due to infrastructure complexity.

---

## Accepted Tradeoff

Platform HITL abstraction adds overhead that is only proven valuable at the second domain. For a single-domain portfolio, this is deliberate over-engineering — explicitly designed to demonstrate enterprise architectural thinking over implementation convenience.

This tradeoff is accepted and documented rather than hidden. The portfolio audience (peer architects and hiring managers) will recognise the pattern as a platform design signal, not unnecessary complexity.
