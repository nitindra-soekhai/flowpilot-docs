# ADR-015 — LangGraph State Machine over Autonomous Multi-Agent Orchestration

**Status:** Accepted — May 2026

**Layer:** 🟣 Agentic AI
> The vendor assessment workflow in flowpilot-vendor-onboarding is realised as a single deterministic LangGraph state machine. The RAG service is unaffected — it is called as a stateless tool from within the graph.

**Author:** Nitindra Soekhai, NSCS B.V.
**Relates to:** ADR-003 (LangGraph restricted to domain layer), ADR-004 (HITL as platform concern), ADR-005 (SQLite workflow state)

---

## Context

FlowPilot positions its vendor onboarding domain as a *governed multi-agent collaboration pattern* — the "Multi-Agent System spoke" in the architecture overview. The implementation question is what "multi-agent" means in practice:

- **A) An explicit state machine** — a single directed LangGraph graph of deterministic nodes (intake → retrieve policy → assess → request approval → finalize) with conditional edges and one HITL gate. "Multiple agents" become specialised nodes inside one graph with a fixed topology.
- **B) An autonomous multi-agent system** — several role-playing LLM agents (e.g. a researcher, an assessor, an approver) that decide their own next actions and delegate to each other at runtime, as in CrewAI, AutoGen, or supervisor/swarm patterns.

This is distinct from ADR-003, which decided *where* LangGraph lives (domain layer only). This ADR decides *how* the agentic workflow is structured: deterministic graph versus emergent agent control flow.

The vendor onboarding domain is a procurement-governance workflow. It must produce a reproducible audit trail (the 11 fixed audit event types), must pause at exactly one human-approval gate, and must persist and resume its state across that suspension (ADR-005).

---

## Decision

**The vendor assessment is modelled as a single governed LangGraph state machine with a hand-authored, fixed topology. Specialisation lives in nodes, not in autonomous agents.** Control flow is deterministic and inspectable; the HITL gate is a fixed node, not an emergent decision.

---

## Alternatives Considered

**Autonomous multi-agent framework (CrewAI / AutoGen)**
Role-based agents that plan and delegate at runtime. Rejected because non-deterministic control flow is incompatible with the domain's governance requirements: there is no guarantee the same inputs traverse the same path, no guarantee the human-approval gate is reached every run, and no stable mapping from execution to the fixed audit event types. Enterprise procurement decisions must be reproducible and explainable; emergent agent behaviour cannot promise either.

**Single monolithic LLM agent (one ReAct-style prompt with tools)**
Simpler to build — one agent with retrieval and assessment tools. Rejected because it collapses retrieval, assessment, and decision into one opaque step. There is no inspectable intermediate state to audit, nowhere clean to insert the HITL pause mid-flow, and no natural checkpoint to persist and resume across the approval suspension (ADR-005).

**Hierarchical supervisor multi-agent (an LLM router over sub-agents)**
LangGraph can express a supervisor that routes to sub-agents. Rejected because the routing LLM reintroduces non-determinism at the control layer for no benefit: the assessment flow is known and fixed, so a *learned* router adds token cost and a new failure mode (mis-routing) without adding any capability a static edge does not already provide.

---

## Accepted Tradeoff

The graph topology is fixed and hand-authored. The system cannot reshape its own workflow at runtime the way an autonomous agent collective could, and adding a new assessment step means editing the graph and redeploying rather than dropping in another agent. This rigidity is the cost of determinism.

It is accepted because reproducibility, a complete and stable audit trail, and a guaranteed single HITL gate are non-negotiable for the procurement domain — and because the workflow shape is stable and known, runtime adaptability buys nothing here. "Governed" in *governed multi-agent collaboration* is precisely this choice: collaboration between specialised nodes under a deterministic, auditable controller, not emergent behaviour between autonomous agents.

---

## Consequences

**Positive:**
- Deterministic, reproducible execution — identical inputs traverse an identical path.
- The HITL gate is a structural guarantee, not a probabilistic outcome.
- Every transition maps cleanly to the fixed audit event types and persists to SQLite for resume.
- The graph is statically inspectable and reviewable before deployment.

**Negative:**
- Workflow topology cannot adapt at runtime; new steps require a code change and redeploy.
- Node specialisation is bounded by what the authored graph anticipates.
- The "multi-agent" framing must be read as *governed orchestration of specialised nodes*, which has to be communicated carefully to avoid implying autonomous-agent capabilities the system deliberately does not have.

---

*FlowPilot · NSCS B.V. · ADR-015 · May 2026*
