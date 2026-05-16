# ADR-009 — Mock Mode for Zero-Friction Demonstration

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

FlowPilot uses the OpenAI API for embeddings and LLM inference. Anyone who wants to run the portfolio locally — a hiring manager, peer architect, or curious reviewer — would need their own OpenAI API key and incur costs, however small. This creates friction that may prevent reviewers from running the system at all.

Additionally, integration tests that call real APIs are slow (2-10 seconds per test), expensive (tokens consumed per run), and non-deterministic (LLM output varies). A test suite that calls real OpenAI is not a test suite — it is an experiment.

---

## Decision

**`FP_MOCK_MODE=true` environment variable switches both services to return realistic pre-defined responses instead of calling OpenAI.** 

In mock mode:
- Ingestion simulates chunking and storage without calling the embedding API
- Retrieval returns realistic mock policy chunks with plausible scores
- The LLM returns structured mock policy guidance referencing real regulatory frameworks (GDPR, ISO 27001, SOC 2)
- The full workflow — ingestion, retrieval, agent state machine, HITL, audit log, trace ID — executes correctly
- `docker-compose up` with zero API key and zero cost

---

## Alternatives Considered

**Bring-your-own-key only**  
Standard practice. Requires account creation and API key generation — a 5-minute step that will prevent some reviewers from running the system. Hiring managers without technical backgrounds may not complete the setup. Rejected because portfolio accessibility is a design requirement.

**Hosted live demo only**  
Requires deployment infrastructure and ongoing cost. The system is not self-hostable for reviewers. Rejected because self-hostability is a key evaluation signal — a reviewer should be able to clone, run, and explore without external dependencies.

**Recorded demo video only**  
Passive — the reviewer cannot explore, change inputs, or test edge cases. Rejected as the sole demonstration method. A video alongside a runnable system is the right combination.

**Free OpenAI tier**  
Still requires OpenAI account creation, API key management, and has rate limits that may affect demo reliability. Rejected because it solves the cost problem but not the friction problem.

---

## Accepted Tradeoff

Mock responses do not reflect real LLM output quality. A reviewer running in mock mode sees the architecture, the workflow, the observability, and the resilience — but not the actual quality of AI-generated policy recommendations.

This is explicitly documented in the README: *"Running in mock mode demonstrates the platform architecture. To evaluate AI recommendation quality, bring your own OpenAI API key or watch the demo video where real responses are shown."*

Reviewers who want to evaluate AI output quality are directed to: (a) set their own API key and run with `FP_MOCK_MODE=false`, or (b) watch the Day 4 demo video recorded with live OpenAI.
