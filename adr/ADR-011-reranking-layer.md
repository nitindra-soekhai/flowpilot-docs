# ADR-011 — No Dedicated Reranking Layer at Portfolio Scope

**Status:** Accepted — May 2026, revisit at production scale  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

After hybrid retrieval returns a ranked list of policy chunks, there is an architectural decision about whether to apply a second-pass reranking step before passing chunks to the LLM. Reranking uses a cross-encoder model (e.g. `cross-encoder/ms-marco-MiniLM-L-12-v2`) or a managed reranking API (Cohere Rerank, Voyage AI) to re-score the top-k candidates with higher precision than the initial retrieval ranking.

The question for FlowPilot is: when does reranking improve grounding quality enough to justify the added latency and cost?

The retrieval pipeline already applies two precision improvements: hybrid retrieval (dense + sparse fusion) and a confidence threshold gate (blocks LLM call if top score < 0.65). The question is whether a third layer — reranking — is justified.

---

## Decision

**No dedicated reranking layer at portfolio scope.** Hybrid retrieval with reciprocal rank fusion provides sufficient ranking quality for the policy domain at the demonstrated scale (hundreds of policy documents, not millions). The confidence threshold gate handles the low-quality retrieval case structurally.

---

## When Reranking Adds Material Value

Reranking is most valuable under specific conditions that do not fully apply at portfolio scope:

| Condition | Portfolio scope | Production scope |
|-----------|----------------|-----------------|
| Corpus size | Small-medium (hundreds of docs) | Large (tens of thousands of chunks) |
| Query ambiguity | Structured domain queries | High-variance natural language |
| Precision requirement | High (policy compliance) | Very high (regulatory audit) |
| Latency budget | Mock: <1ms; live: 2-5s (OpenAI dominates) | Stricter SLAs |

At portfolio scale, the top-k results from hybrid retrieval are already high-precision for the specific policy query domain. The marginal precision gain from reranking would be difficult to measure without a held-out evaluation set.

---

## Alternatives Considered

**Cohere Rerank API**  
Managed reranking service, good performance on English-language documents, simple API integration. Adds a third external service dependency (OpenAI + Qdrant + Cohere). Also adds ~200-500ms latency per query for an API round trip. Rejected at portfolio scope because the external dependency adds friction for local demonstration and the marginal precision gain at this corpus size is not demonstrable without formal evaluation.

**Cross-encoder local model (sentence-transformers)**  
No external dependency, runs locally. Adds memory pressure to the Docker environment (8GB RAM ceiling on development machine, 3GB WSL2 cap). A MiniLM cross-encoder model requires ~300MB of RAM in addition to already-running services. Rejected due to hardware constraints explicitly — not because local reranking is architecturally wrong.

**LLM-based reranking (ask GPT to pick the best chunks)**  
Uses the LLM itself to rerank candidates before final grounding. Adds a second LLM call per query, roughly doubling inference cost and latency. The latency and cost overhead is disproportionate to the benefit at this corpus scale. Rejected for portfolio scope.

---

## Production Design

At production scale (enterprise corpus of 50,000+ policy chunks across regulatory frameworks, internal procedures, and vendor contracts), reranking becomes necessary because:

1. Hybrid retrieval top-k candidates at large corpus scale contain more false positives
2. Cross-encoder models can distinguish between a chunk that *mentions* a concept and a chunk that *defines* the relevant rule — a distinction embeddings consistently miss
3. The latency cost of reranking (~100-300ms local, ~200-500ms API) is acceptable when the alternative is passing imprecise context to the LLM and receiving a poorly-grounded response

**Production recommendation:** Integrate Cohere Rerank or a locally-hosted cross-encoder after hybrid retrieval fusion. Apply reranking only to the top-20 hybrid retrieval candidates, then pass the top-5 reranked chunks to the LLM. This limits reranking latency to the top-20 subset while improving the precision of what the LLM actually sees.

This is documented as a follow-on architectural decision — to be captured as ADR-012 when the production corpus scale is confirmed.

---

## Accepted Tradeoff

Without reranking, the grounding quality depends entirely on hybrid retrieval precision. For the current corpus size and query domain, this is acceptable. The risk is that as the policy corpus grows, retrieval precision degrades faster than expected and grounding quality deteriorates before reranking is added.

The mitigating control is the confidence threshold gate: if retrieval quality drops, the confidence threshold will catch low-score retrievals and block the LLM call rather than allowing poorly-grounded responses to reach users. This is not a full substitute for reranking but it is a meaningful safety net.
