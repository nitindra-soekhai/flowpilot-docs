# ADR-003 — LangGraph Restricted to Domain Layer

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

LangGraph is required for the vendor assessment agent state machine — a directed graph of async nodes with conditional edges and HITL pause/resume. The architectural question was whether to introduce LangGraph at the platform level (all future domains inherit it as the orchestration framework) or restrict it to the vendor onboarding domain implementation only.

This decision has lasting consequences: a platform-level LangGraph dependency means every domain that uses the platform is coupled to LangGraph's API evolution.

---

## Decision

**LangGraph is used only in `flowpilot-vendor-onboarding`. The platform layer (`flowpilot-platform`) exposes framework-neutral orchestration interfaces: HITL hooks, audit event emitters, and state transition contracts. Domain implementations choose their own orchestration framework.**

---

## Alternatives Considered

**LangGraph as platform-level orchestrator**  
All domains use LangGraph by inheriting the platform orchestration layer. Simpler for the first domain — no interface design required. Rejected because it creates framework lock-in at the platform level. When LangGraph evolves (as it has significantly between 0.1.x and 0.2.x), every domain implementation is affected. A future domain that does not require a state machine is still forced to model its workflow as a LangGraph graph.

**Custom orchestration engine in the platform**  
Build a framework-neutral workflow engine in the platform. No external dependency. Rejected due to build cost — a production-grade orchestration engine is a significant engineering effort, beyond the scope of a portfolio demonstration.

**Temporal for durable execution**  
Production-grade durable workflow execution with built-in retry, compensation, and state persistence. Rejected because Temporal requires a separate server infrastructure (Temporal service + database) that adds significant operational complexity beyond portfolio scope. The correct choice for a production system at enterprise scale.

---

## Accepted Tradeoff

Other domain implementations must bring their own orchestration framework. The platform provides no pre-wired agent framework, which increases integration effort per new domain. The platform HITL interface must be implemented by each domain against its chosen framework.

This is accepted because platform-level framework lock-in creates a harder migration path when LangGraph evolves or is superseded. The version compatibility issue encountered during the portfolio build (Command import path changes between LangGraph minor versions) validates this concern empirically.
