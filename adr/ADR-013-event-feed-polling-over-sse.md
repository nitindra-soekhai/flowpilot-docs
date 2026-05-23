# ADR-013 — Event Feed Implementation: UI Polling over SSE

**Status:** Accepted — May 2026

**Layer:** 🟡 Boundary — UI ↔ Vendor Onboarding API
> This is a UI-backend contract decision. The polling interval and terminal-state detection live in the React UI; the event persistence and endpoint behaviour live in the vendor-onboarding API. Neither LangGraph internals nor the HITL gate are affected.

**Author:** Nitindra Soekhai, NSCS B.V.
**Relates to:** ADR-003 (LangGraph domain-only), ADR-004 (HITL as platform concern), ADR-005 (SQLite workflow state)

---

## Context

The vendor-onboarding LangGraph graph runs **synchronously** inside the POST /workflows request handler. The implementation uses `_drain_graph`, which calls `graph.astream()` and exhausts the async generator before the POST returns. This means:

- All graph nodes execute before 201 is sent to the caller
- All workflow events are written to SQLite before 201 arrives at the UI
- The graph produces no in-flight output — it is a batch operation from the UI's perspective

In mock mode (`FP_MOCK_MODE=true`) the graph completes in under 200 ms, so the delay is imperceptible. In live mode (two RAG calls to flowpilot-rag-service, each hitting Qdrant and OpenAI), the total graph latency is **6–16 seconds**. During that window the UI has no feedback.

Two options were evaluated for surfacing graph events progressively in the UI.

### Option A — Server-Sent Events + async LangGraph decoupling

- Accept the POST and return 202 immediately
- Decouple graph execution onto a background task
- Add a GET /workflows/{id}/events SSE endpoint that streams events as they are written
- Requires: converting `_drain_graph` to a background task, adding an SSE router, verifying SQLite WAL mode handles concurrent reads during graph writes, confirming the single Uvicorn worker constraint (ADR-005 / ADR-006) is compatible

This option yields genuinely real-time event streaming. It also changes the POST contract (202 vs 201), adds a new transport protocol (SSE), and requires async refactoring of the LangGraph execution path — estimated 1–2 days of backend work with non-trivial risk to the HITL gate.

### Option B — Synchronous LangGraph, UI polls GET /workflows/{id}/events

- POST /workflows returns 201 when the graph completes (unchanged)
- All events are in SQLite by the time 201 arrives
- After receiving 201, the UI polls GET /workflows/{id}/events every 2 seconds
- Events appear progressively in the UI panel as they are polled
- The endpoint returns events ordered by `id ASC` (INTEGER PRIMARY KEY AUTOINCREMENT)
- A `since_event_id` query parameter (Track 4) allows the client to request only events with `id > n`, reducing payload size on subsequent polls

---

## Decision

**Option B — UI polls GET /workflows/{id}/events every 2 seconds.**

The POST /workflows contract is unchanged. The UI begins polling immediately after receiving 201, displaying events progressively as each poll returns new rows. Polling stops when the latest event's `current_state` is `pending_approval` or `complete`.

---

## Rationale

| Factor | Option A (SSE) | Option B (Polling) |
|--------|---------------|-------------------|
| Backend risk | High — async refactor of LangGraph execution path | Zero — no backend changes |
| HITL gate impact | Requires careful validation | Unaffected |
| New transport protocol | Yes — SSE router required | No — existing REST endpoint |
| POST contract change | 202 Accepted | 201 Created (unchanged) |
| Implementation time | 1–2 days | 2–3 hours (UI only) |
| Real-time fidelity | True streaming (events during graph execution) | Simulated (events after graph completion) |
| Demo readiness | Requires backend completion | Demo-ready immediately |

Option B delivers the observable result — events appearing progressively in the UI — without touching the backend execution path. For portfolio demonstration scope, the distinction between "events streamed during execution" and "events polled after execution" is not visible to an observer watching the UI.

---

## Trade-offs Acknowledged

1. **Events appear after graph completion, not in-flight.** In live mode, the UI shows a loading state for 6–16 seconds while the graph runs, then events appear progressively as polls return. This is not true real-time streaming — it is a simulated progressive feed over a completed dataset.

2. **~6–16 second blank loading state in live mode.** The UI must display a meaningful loading indicator during the POST /workflows call. This is addressed by the loading state UI component; it is a known and accepted UX cost.

3. **Polling is not truly real-time.** A 2-second poll interval means the UI may lag up to 2 seconds behind actual event creation. In live mode where all events exist before the first poll fires, the lag is zero — all events are returned on the first poll. In mock mode the graph completes in <200ms, so the same applies.

4. **Unnecessary polls after terminal state.** Without a termination condition, the UI would poll indefinitely. The polling loop must check `current_state` on each response and stop when the state is `pending_approval` or `complete`.

---

## Future Work — Option A

Option A (SSE + async LangGraph decoupling) is the correct architecture for a production release. It requires:

1. Converting the LangGraph execution path from synchronous `_drain_graph` to a background task spawned on POST /workflows (returning 202 Accepted)
2. Adding a GET /workflows/{id}/events SSE endpoint that pushes events as rows are written to SQLite
3. Confirming SQLite WAL mode (Track 3, being enabled in parallel) handles concurrent reads during graph writes correctly under the single-worker constraint
4. Updating the UI to switch from polling to an `EventSource` connection

This is documented as deferred work. It should be the first streaming-related item in the production backlog. The polling implementation (Option B) does not block Option A — the GET /workflows/{id}/events endpoint and its `since_event_id` parameter are compatible with both polling and SSE clients.

---

## Consequences

**Positive:**
- Zero backend risk — LangGraph execution path unchanged
- HITL gate completely unaffected
- POST /workflows contract unchanged (201)
- Demo-ready in 2–3 hours (UI-only change)
- GET /workflows/{id}/events endpoint is reusable for Option A transition

**Negative:**
- Not true real-time streaming — events appear after graph completion
- 6–16 second blank loading state in live mode requires deliberate UX handling
- Polling adds unnecessary HTTP requests after the terminal state is reached if termination logic is not implemented

---

*FlowPilot · NSCS B.V. · ADR-013 · May 2026*
