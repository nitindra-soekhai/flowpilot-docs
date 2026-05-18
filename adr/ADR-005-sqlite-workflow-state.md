# ADR-005 — SQLite for Workflow State

**Status:** Accepted — May 2026, revisit at production scope  

**Layer:** 🟣 Agentic AI
> Workflow state persistence is an agentic concern. The agent must remember where it is in the multi-step process across the HITL suspension. The RAG service is stateless and uses no persistent state store.
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The vendor onboarding workflow requires persistent state across steps: vendor information, submitted documents, security findings, approval status, and the full event history. State must survive process restarts. A production system requires a distributed, durable database with connection pooling and multi-instance support.

Portfolio scope is single-node demonstration on a machine with 8GB RAM (WSL2 capped at 3GB). Docker Desktop, Qdrant, the RAG service, and the vendor onboarding service all run simultaneously.

---

## Decision

**SQLite via `aiosqlite` async driver. Zero-config, file-based, sufficient for single-node demo. The schema uses ANSI SQL throughout. The data access layer (`workflow_store.py`) abstracts the database entirely — the router and graph nodes have no SQL knowledge.**

---

## Alternatives Considered

**PostgreSQL**  
Production-grade. Multi-instance support, connection pooling, full ACID guarantees. Adds a third Docker service (alongside Qdrant and the two application services), configuration overhead, and memory pressure on an 8GB machine. Rejected for portfolio scope — documented as the production upgrade path.

**Redis**  
Fast, low memory footprint. Not durable by default — requires AOF (append-only file) configuration for persistence. Redis data structures require a different query model than relational joins. Rejected because workflow state requires relational queries (join workflow + events + audit on trace_id) that are natural in SQL and awkward in Redis.

**In-memory state (Python dict)**  
Zero setup, maximum simplicity. Lost on process restart — incompatible with the workflow recovery requirement. Any crash during a multi-step workflow loses all state. Rejected because demonstrable workflow recovery was a design requirement.

---

## Accepted Tradeoff

SQLite is not suitable for multi-instance deployment or high-concurrency production workloads. Two uvicorn workers sharing a SQLite file would experience write contention. The portfolio is deployed with `--workers 1` explicitly.

Migration to PostgreSQL requires: updating the `DATABASE_URL` environment variable, running `alembic upgrade head` (migrations are ANSI SQL), and removing the SQLite-specific `aiosqlite` driver. The ORM abstraction reduces migration risk to a configuration and migration script change — no application code changes required.
