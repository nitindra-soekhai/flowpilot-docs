# ADR-002 — Hybrid Retrieval over Dense-Only

**Status:** Accepted — May 2026  

**Layer:** 🔵 RAG
> Retrieval strategy decision within flowpilot-rag-service. The agentic layer calls POST /query and receives results; it has no knowledge of dense or sparse vectors.
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

Early retrieval testing on the FlowPilot policy corpus showed a consistent failure mode in dense-only search: semantically fluent chunks outranked chunks containing exact regulatory identifiers. A policy chunk mentioning "data protection obligations" outranked a chunk containing the exact clause "GDPR Article 28(3)" when queried with "GDPR Article 28(3)". For a governance platform where users query by regulatory reference, this is a critical accuracy gap.

Dense embeddings capture semantic meaning well but deprioritise exact-match signals. Sparse retrieval (BM25-style) prioritises exact term frequency — the complement of what dense retrieval does poorly.

---

## Decision

**Hybrid retrieval combining OpenAI dense embeddings with Qdrant sparse vectors, fused via reciprocal rank fusion with configurable weights.**

Dense retrieval handles paraphrased queries. Sparse retrieval handles exact regulatory identifier queries. Reciprocal rank fusion merges the ranked lists without requiring score normalisation across different similarity spaces.

---

## Alternatives Considered

**Dense-only retrieval**  
Simpler implementation, lower latency, lower infrastructure complexity. Rejected because it consistently fails on exact regulatory identifier queries — the primary failure mode for a governance use case.

**BM25-only retrieval**  
Fast, no embedding cost, no GPU requirement. Loses semantic matching for paraphrased queries ("what certifications does this vendor need?" vs "SOC 2 Type II"). Rejected because paraphrased natural language queries are the primary user interaction mode.

**Reranking-only model on top of dense results**  
Cross-encoder reranking improves precision on the top-k dense results but does not retrieve candidates that dense search misses entirely. An exact-match clause that scores below the dense top-k is invisible to reranking. Rejected because it does not address the retrieval gap — only the ranking of already-retrieved results.

---

## Accepted Tradeoff

Hybrid retrieval requires calibration of the dense/sparse weight balance per document corpus. The optimal weight ratio is not transferable across domains without re-evaluation on a domain-specific held-out set. For portfolio scope, weights are set to a reasonable default (0.7 dense / 0.3 sparse) without a formal evaluation — this is documented explicitly rather than presented as a tuned production configuration.

Dense-only is sufficient for general-purpose RAG applications that do not require exact regulatory identifier retrieval. The hybrid complexity is justified specifically by the governance domain requirements.
