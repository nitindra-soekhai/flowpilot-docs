# ADR-019 — OPSWAT MetaDefender Cloud API for document virus scanning

**Status:** Accepted — May 2026  

**Layer:** 🟠 Shared
> Applies to the Admin Document Upload module. The scan boundary applies in every FlowPilot repo that accepts user-uploaded documents. Scanning is enforced before any document reaches the job queue or ingestion pipeline.  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The Admin Document Upload module accepts PDF and document uploads from authenticated admin users. Uploaded documents are ingested into the RAG knowledge base and made available to the grounding pipeline. If a malicious or infected document enters the pipeline, it could corrupt the knowledge base or be processed by downstream services.

A scan boundary must be established at the upload API boundary — before any document is enqueued, stored, or processed. The scanner implementation must be replaceable (ADR-018 adapter pattern) and must be operable in a local demo without requiring API keys or Docker services.

---

## Decision

**OPSWAT MetaDefender Cloud API (free tier, 5,000 scans/day) with hash-first check. Scanning occurs before the job queue — always.**

**Enforced scan boundary:**
```
Upload API → DocumentScanner.scan() → CLEAN    → JobQueueRepository.enqueue()
                                    → INFECTED  → HTTP 422 + audit event + admin notification
                                    → ERROR     → HTTP 503 + audit event (scan unavailable)
```

Infected documents never reach the pipeline. The scan is synchronous — no document is enqueued until a CLEAN result is returned.

**Hash-first optimisation:** SHA-256 hash is computed before any API call. If the hash matches a known-clean result in the local cache, the API call is skipped. Only unknown documents are sent to OPSWAT.

**MOCK_MODE behaviour:**

| MOCK_MODE | Behaviour |
|-----------|-----------|
| `true` | Returns `ScanResult.CLEAN` immediately. No API call. No key required. |
| `false` | Hash check first → OPSWAT API only if hash unknown. |

---

## Alternatives Considered

| Option | Verdict | Reason |
|--------|---------|--------|
| OPSWAT MetaDefender Cloud API | ✅ Chosen | 30+ engines, free tier, REST API, no Docker service, hash-first minimises egress |
| ClamAV | Rejected | Single scanning engine, requires Docker service (cold start, orchestration overhead), no cloud equivalent for production |
| Defender for Storage | Rejected | Azure Blob Storage only — no local scanning, no demo path without Azure subscription |
| OPSWAT Core (on-premises) | Future path | Trial licence required; swap path documented: one adapter file, no domain change |
| VirusTotal API | Rejected | Free tier shares scans publicly — not acceptable for client document confidentiality |

---

## Confidentiality Mitigations

Unknown documents are uploaded to OPSWAT Cloud for scanning. The following mitigations are applied:

1. **Hash-first:** Known-clean files never egress to OPSWAT. Only documents with an unknown hash are transmitted.
2. **TLS 1.2+:** All API calls use encrypted transport.
3. **Zero retention:** OPSWAT MetaDefender Cloud does not retain file content after scan completion — only the hash and result are persisted.
4. **Egress firewall:** Outbound traffic permitted only to `api.metadefender.com`.
5. **API key management:** `OPSWAT_API_KEY` stored in `.env` (demo) / Azure Key Vault (production, ADR-016).

For classified or regulated client documents, swap to OPSWAT Core on-premises: one adapter file, no domain code changes.

---

## Audit Events

Every scan produces a structured log event (ADR-010):

| Event | Trigger | Fields |
|-------|---------|--------|
| `document.scan.initiated` | Scan begins | `filename`, `sha256_hash`, `uploaded_by`, `mock_mode` |
| `document.scan.completed` | Scan returns CLEAN | `result`, `duration_ms`, `sha256_hash`, `engine_count` |
| `document.scan.failed` | Scan returns INFECTED or ERROR | `result`, `filename`, `uploaded_by`, `reason` |

---

## Accepted Tradeoff

Unknown documents are uploaded to OPSWAT Cloud. This is acceptable for portfolio-grade documents. For classified client data, OPSWAT Core on-premises is the documented production upgrade path — one adapter swap, no domain changes. The free tier limit (5,000 scans/day) is sufficient for all demo and portfolio use.

`OPSWAT_API_KEY` is not provisioned at Day 9. `MOCK_MODE=true` covers all Day 9 implementation. Add the key to `.env` when obtained from the OPSWAT portal.

---

## Testability

`MOCK_MODE=true` provides a deterministic `DocumentScanner` adapter returning `ScanResult.CLEAN` for all inputs. Unit tests use MOCK_MODE exclusively — no network, no key, no cost.

Integration tests targeting the real OPSWAT API must be marked `@pytest.mark.integration` and never run in CI (ADR — test strategy). Scan boundary enforcement is unit-testable: inject a mock scanner returning `INFECTED` and assert the upload API returns HTTP 422 and emits the correct audit event.
