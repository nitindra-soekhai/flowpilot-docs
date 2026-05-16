# ADR-001 — Qdrant over PostgreSQL pgvector

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

FlowPilot requires hybrid retrieval — combining dense semantic search with sparse keyword matching. Policy documents contain specific regulatory codes and identifiers (ISO 27001, GDPR Article 28, SOC 2 Type II) that semantic search consistently deprioritises in favour of semantically fluent but imprecise chunks. A retrieval system that cannot surface an exact clause reference when queried by that reference is not fit for a governance use case.

The vector store choice determines whether hybrid retrieval is possible natively or requires additional infrastructure.

---

## Decision

**Qdrant via Docker.**

Qdrant natively supports both dense and sparse vectors in a single collection, eliminating the need for a separate full-text index service. Hybrid retrieval is a first-class feature — not an integration problem.

---

## Alternatives Considered

**pgvector + PostgreSQL FTS**  
Would require dense vector search via pgvector and keyword search via PostgreSQL full-text search, fused in application code with JOIN logic. Hybrid retrieval across two systems adds query complexity, increases latency, and requires careful transaction management. The natural choice in a production environment already running PostgreSQL — explicitly rejected here because the FTS/pgvector fusion would be more complex to demonstrate cleanly.

**Weaviate**  
Supports hybrid retrieval natively. Rejected because the operational setup (module configuration, schema definition) is significantly more complex for a 3-4 day portfolio build. Adds non-trivial setup overhead before the first document is ingested.

**Pinecone**  
Managed service — no Docker setup required. Rejected because it adds an external service dependency and ongoing cost for reviewers who want to run the system locally. Conflicts with the zero-friction local demonstration goal (see ADR-009).

---

## Accepted Tradeoff

pgvector would be the natural production choice in a PostgreSQL-based enterprise environment — it avoids adding a separate vector database service. Qdrant adds an additional Docker container to the compose stack and an additional operational concern in production.

In a production deployment, the choice between Qdrant and pgvector would be driven by the existing database infrastructure. If PostgreSQL is already the primary datastore, pgvector consolidation would be evaluated and documented as a follow-on ADR. This decision is explicitly portfolio-scoped.
