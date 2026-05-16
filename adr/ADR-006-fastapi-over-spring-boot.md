# ADR-006 — FastAPI over Spring Boot

**Status:** Accepted — May 2026, portfolio-scoped  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The portfolio requires a working, demonstrable system built in 3-4 days. Both FastAPI (Python) and Spring Boot (Java) are viable enterprise API frameworks with production track records in large organisations. The choice affects development velocity, ecosystem fit with the AI toolchain, and the signal it sends to a Java-first enterprise audience.

---

## Decision

**FastAPI.** Python's AI ecosystem (LangChain, LangGraph, OpenAI SDK, Qdrant client) integrates natively. Spring Boot would require JVM bridge layers or LangChain4j, which is less mature for agentic workflows at the time of writing.

---

## Alternatives Considered

**Spring Boot with LangChain4j**  
The Java-first enterprise default. Strong production track record. LangChain4j is maturing rapidly but has a smaller community and fewer agentic workflow examples than the Python LangGraph ecosystem. Integration with Qdrant requires the Qdrant Java client which has less documentation. Rejected for portfolio scope — would add 1-2 days of integration friction that reduce time available for architectural depth.

**Django REST Framework**  
More batteries-included than FastAPI. Heavier than needed — the ORM, admin interface, and session middleware add overhead that brings no value in a microservice context. FastAPI's dependency injection model is a better fit for the RBAC pattern.

**Flask**  
Lightweight but too minimal for enterprise patterns. No built-in async support, no typed request/response models, no automatic OpenAPI generation. Would require significant boilerplate to achieve what FastAPI provides out of the box.

---

## Accepted Tradeoff

FastAPI is not the default in Java-heavy enterprise environments. A production deployment in a Java-first organisation would likely use Spring Boot for the API layer with Python AI microservices called over REST — exactly the pattern FlowPilot uses (FastAPI services called by a Java orchestration layer is a valid production topology).

This decision is explicitly portfolio-scoped and documented as such. It is not presented as a universal recommendation. An architect reviewing this portfolio should read this ADR before concluding "they chose Python because they don't know Java."
