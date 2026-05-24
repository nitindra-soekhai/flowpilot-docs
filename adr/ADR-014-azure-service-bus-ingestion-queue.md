# ADR-014 — Azure Service Bus as Async Ingestion Queue

**Status:** Accepted — May 2026

**Layer:** 🔵 RAG
> Async document ingestion is a flowpilot-rag-service concern. The agentic layer never ingests documents — it only queries the corpus via POST /query and is unaffected by how documents reach Qdrant.

**Author:** Nitindra Soekhai, NSCS B.V.
**Relates to:** ADR-001 (Qdrant over pgvector), ADR-007 (retrieval separated from orchestration), ADR-009 (mock mode)

---

## Context

The RAG service ingests PDF policy documents through a fixed pipeline: **PDF → chunk → embed → Qdrant** (see C4 container diagram). In the portfolio build this pipeline is triggered **in-process** on `POST /ingest` and runs synchronously inside the request handler.

That is acceptable for a demonstration corpus but does not survive contact with production:

- Embedding a multi-hundred-page document takes tens of seconds and dozens of OpenAI calls. Running it inside the request blocks the HTTP worker for the full duration.
- A failure mid-pipeline (OpenAI rate limit, Qdrant timeout) loses the document — there is no retry and no record that ingestion was attempted.
- The single Uvicorn worker constraint (ADR-005 / ADR-006) means one large ingest starves all other requests, including queries.
- There is no backpressure: a burst of uploads has no buffer between the API and the embedding/storage work.

The question is what async ingestion mechanism to standardise on for production, while keeping the portfolio demo zero-infrastructure.

---

## Decision

**Production uses Azure Service Bus as the async ingestion queue. The portfolio demo uses FastAPI `BackgroundTasks`.**

`POST /ingest` validates the document and enqueues an ingestion message, returning immediately. A worker consumes the queue and runs the chunk → embed → Qdrant pipeline out of band. The same dual-mode pattern used elsewhere in FlowPilot applies: the infrastructure-heavy path is the production default, and a zero-dependency fallback keeps the demo runnable without a cloud account (consistent with the ingestion-queue row in the README configuration table).

---

## Alternatives Considered

**Synchronous in-process ingestion (current demo path)**
No queue — the pipeline runs inside `POST /ingest`. Rejected for production because it blocks the worker for the full embedding duration, has no retry, and loses the document on any mid-pipeline failure. It is retained only as the mock-mode behaviour where ingestion is simulated (ADR-009).

**FastAPI `BackgroundTasks` only**
Offloads the work off the request thread with zero infrastructure. Rejected as a *production* answer because the task lives in the same process: it dies with the worker, has no durability, no retry, no dead-lettering, and no visibility into queue depth. It is exactly right for the demo, so it becomes the fallback rather than the production mechanism.

**Celery + Redis or RabbitMQ**
A capable, framework-agnostic task queue. Rejected because it introduces a broker (and, for Celery, a result backend) as additional stateful services to deploy, secure, and monitor. The platform is already committed to the Azure ecosystem — Key Vault for secrets, Keycloak hosting — so a managed Azure queue removes operational surface rather than adding a self-managed broker.

**Kafka**
Designed for high-throughput event streaming with consumer groups and log replay. Rejected as over-scoped: ingestion is a task-queue workload with dead-lettering and at-least-once delivery, not an event-streaming firehose. Kafka's operational cost (cluster, partitions, offset management) is unjustified at this volume. (ADR-007 evaluated Kafka/RabbitMQ for the orchestration ↔ retrieval boundary and rejected it there for related reasons.)

**AWS SQS**
A functionally equivalent managed queue. Rejected because the deployment target is Azure; running the queue in a second cloud adds cross-cloud IAM, networking, and egress cost for no benefit.

---

## Accepted Tradeoff

Azure Service Bus is a managed cloud dependency and a vendor lock-in point. Local development cannot reach it without the emulator, which is why the `BackgroundTasks` fallback exists and must be maintained as a real second code path rather than a stub.

Async ingestion is **eventually consistent**: a document is not queryable until the worker finishes, so the API must expose ingestion status (queued → processing → indexed → failed) rather than implying success on `202`. At-least-once delivery means the same message can be delivered twice, so the pipeline must be **idempotent** — de-duplicated by document content hash so a redelivery does not create duplicate chunks in Qdrant.

This is accepted because durability, retry with dead-lettering, backpressure, and decoupling of the API worker from embedding latency are hard requirements for production ingestion, and a managed queue delivers them with the least operational surface given an Azure-committed platform.

---

## Consequences

**Positive:**
- `POST /ingest` returns immediately; the API worker is never blocked by embedding latency.
- Failed ingestion retries automatically and dead-letters after exhausting attempts — no silent document loss.
- Queue depth gives natural backpressure and an observable signal for scaling the worker.
- Workers scale independently of the API, sidestepping the single-Uvicorn-worker constraint for ingestion.

**Negative:**
- A managed Azure dependency and a lock-in point; local dev relies on the emulator or the `BackgroundTasks` fallback.
- Eventual consistency forces an ingestion-status contract on the API and idempotency on the pipeline.
- Two ingestion code paths (Service Bus + BackgroundTasks) must be kept behaviourally aligned.
- Operating cost: a Service Bus namespace plus dedicated worker compute.

---

*FlowPilot · NSCS B.V. · ADR-014 · May 2026*
