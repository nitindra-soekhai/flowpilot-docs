# ADR-010 — Structured JSON Logging over Traditional Logging

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

Enterprise AI systems require observability beyond application uptime. Every AI decision — retrieval query, LLM call, agent state transition, HITL approval — must be reconstructable from logs after the fact. This requires logs that are machine-parseable, consistently structured, and carry sufficient context (trace_id, workflow_id, user, role) to correlate events across service boundaries.

Traditional Python logging (`logging.basicConfig`, freeform strings) is human-readable but machine-unfriendly. Parsing freeform log strings for audit queries is brittle and operationally expensive.

---

## Decision

**`structlog` with `JSONRenderer` processor chain.** Every log line is a JSON object with mandatory fields: `event`, `level`, `logger`, `timestamp`, and any bound context fields (trace_id, workflow_id, node, user, role). Log lines are written to stdout, consumed by the container runtime, and forwarded to log aggregators (Grafana Loki, ELK, Azure Monitor).

---

## Alternatives Considered

**Standard Python `logging` with `python-json-logger`**  
Produces JSON output. Requires more boilerplate to bind context fields per request. The structlog processor chain is more composable — adding a new context field (e.g. `degraded=True`) is a single `.bind()` call at any point in the call stack, with the field propagated to all subsequent log lines in that context.

**OpenTelemetry with OTLP export**  
Production-grade distributed tracing. Structured spans with parent-child relationships, automatic instrumentation for FastAPI and httpx. Rejected for portfolio scope — requires an OTLP collector (Jaeger, Grafana Tempo) as an additional infrastructure dependency. The trace ID propagation pattern (X-Trace-ID header + structlog bind) achieves the same cross-service correlation without the infrastructure overhead. Documented as the production upgrade path.

**Loguru**  
Simpler API than structlog. Good JSON support. Less common in enterprise Python stacks. The structlog processor chain is more explicit and inspectable — each processing step is visible in the configuration, which is the right signal for an architecture portfolio.

---

## Accepted Tradeoff

structlog JSON output is verbose — each log line carries all bound context fields, which increases log volume. For a system processing thousands of requests per minute, this volume is significant and log aggregation costs would need to be evaluated.

The accepted downside is deliberate: for a governance platform where every AI decision must be auditable, verbose structured logs are a feature, not a bug. The audit requirement justifies the volume. In production, log sampling and tiered storage (hot/warm/cold) would be the operational response to log volume — not reducing log verbosity.
