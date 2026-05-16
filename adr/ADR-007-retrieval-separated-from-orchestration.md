# ADR-007 — Retrieval Service Separated from Orchestration

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The vendor assessment agent requires both retrieval (RAG — find the relevant policy) and workflow orchestration (LangGraph — run the vendor assessment state machine). These could be implemented as a single service or as separate services. The decision has consequences for reusability, independent scaling, and the clarity of the architecture story.

---

## Decision

**Separate services.** `flowpilot-rag-service` handles all retrieval and grounding. `flowpilot-vendor-onboarding` handles orchestration and calls the RAG service via REST API with trace ID propagation. The RAG service has zero knowledge of vendor onboarding.

---

## Alternatives Considered

**Monolith combining RAG and workflow logic**  
One service, one deployment, no network latency between retrieval and orchestration. Simpler operationally. Rejected because it makes the RAG service unreusable by other domains. When HR onboarding or contract management needs policy retrieval, it would have to duplicate the RAG implementation or couple to the vendor onboarding monolith.

**Shared library via Python package import**  
RAG functionality as a pip-installable package, imported by the vendor onboarding service. Avoids HTTP overhead. Rejected because it creates a tight deployment dependency — any change to the RAG package requires redeployment of all services that import it. It also hides the retrieval call from distributed tracing (no HTTP span, no separate service in the trace).

**Event-driven via message queue (Kafka/RabbitMQ)**  
Retrieval triggered by an event, response returned asynchronously. Decoupled, scalable, resilient to retrieval latency spikes. Rejected because it adds message broker infrastructure beyond portfolio scope and makes the synchronous request-response pattern of a vendor assessment workflow unnecessarily complex.

---

## Accepted Tradeoff

Separation adds one network hop to every retrieval call. For latency-sensitive production use, co-location or response caching would be evaluated. At portfolio scale, the latency is negligible (mock mode: <1ms; live mode: dominated by OpenAI API latency, not the inter-service call).

The separation is a deliberate architectural decision: the RAG service is reusable across any future domain without modification. This is demonstrable — the RAG service has no import, reference, or knowledge of the vendor onboarding service. The only connection is the HTTP call and shared trace ID format.
