# Demo Script

> Step-by-step walkthrough of all three portfolio iterations. Each section can be demonstrated independently. Expected duration: 20-30 minutes for the full script.

---

## Prerequisites

```bash
# Both services running
docker-compose up  # in flowpilot-rag-service/
docker-compose up  # in flowpilot-vendor-onboarding/

# Verify both healthy
curl http://localhost:8000/health  # RAG service
curl http://localhost:8001/health  # Vendor onboarding
```

### Test tokens

```
sarah.chen (procurement_manager):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzYXJhaC5jaGVuIiwicm9sZSI6InByb2N1cmVtZW50X21hbmFnZXIiLCJleHAiOjE4MTAzODAyOTV9.69NDPMuLvKaSZALgFKZci9EEeBRhz1aGJ90wQLlMuME

michael.davidson (security_approver):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtaWNoYWVsLmRhdmlkc29uIiwicm9sZSI6InNlY3VyaXR5X2FwcHJvdmVyIiwiZXhwIjoxODEwMzgwMjk1fQ.-Fy_ZRHejrJl3fRV3tzbtnhzkI7--LPhoMppYjHoUfE
```

---

## Iteration 1 — RAG Service (v0.1-mvp)

**Story:** Upload a policy document. Ask a question. Get a grounded answer with source references. Show the full retrieval trace.

### Step 1 — Ingest a policy document

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -F "file=@sample-vendor-policy.pdf"
```

**Show:** Trace ID in response headers. Structlog JSON lines: chunk count, embedding latency, Qdrant write confirmation.

### Step 2 — Query the knowledge base

```bash
curl -X POST http://localhost:8000/query \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What security certifications are required for cloud vendors?", "top_k": 3}'
```

**Show:**
- `answer` — policy guidance with source citations
- `top_score` — retrieval confidence (should be ≥ 0.65)
- `low_confidence: false` — threshold passed, LLM was called
- `response_blocked: false` — guardrails passed

### Step 3 — Show the retrieval audit log

```bash
sqlite3 flowpilot_rag.db \
  "SELECT query_preview, top_score, latency_ms, confidence_passed, trace_id 
   FROM audit_log ORDER BY id DESC LIMIT 3;"
```

**Talking point:** Every retrieval is logged. Given any trace_id, reconstruct exactly what the AI retrieved, with what score, how long it took.

---

## Iteration 2 — Agentic Workflow + HITL (v0.2-iteration-1)

**Story:** A vendor onboarding request arrives. The agent runs the full assessment pipeline. It pauses waiting for human approval. A security approver makes the decision. Show the cross-service trace.

### Step 4 — Start a vendor onboarding workflow

```bash
curl -X POST http://localhost:8001/workflows/ \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Acme Cloud Analytics",
    "vendor_type": "cloud",
    "business_justification": "Required for Q3 data pipeline project",
    "requested_access_level": "standard",
    "documents": [
      {"document_type": "security_questionnaire", "document_name": "acme_sq.pdf"},
      {"document_type": "data_processing_agreement", "document_name": "acme_dpa.pdf"}
    ]
  }'
```

**Show:**
- `current_state: PENDING_APPROVAL` — agent ran full pipeline and stopped at HITL gate
- `security_findings` — 4 mock findings from security review node
- `policy_guidance` — retrieved from RAG service (note same trace_id in both service logs)
- `next_actions: ["Awaiting security_approver decision"]`

### Step 5 — Show cross-service trace correlation

```bash
# Copy the trace_id from the response, then:
grep "9ffb3094" /var/log/rag-service.log    # RAG service log
grep "9ffb3094" /var/log/onboarding.log     # Vendor onboarding log
```

**Talking point:** The same trace_id appears in both service logs. Given any decision, reconstruct what was retrieved, what the agent recommended, and what the human decided — across service boundaries.

### Step 6 — HITL approval (security_approver role required)

```bash
WORKFLOW_ID="<from step 4 response>"

# This fails — wrong role
curl -X POST http://localhost:8001/workflows/$WORKFLOW_ID/decisions \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -d '{"decision": "approved", "reason": "Self-approved"}'
# → 403 "Role 'procurement_manager' does not have permission 'workflows:approve'"

# This succeeds — correct role
curl -X POST http://localhost:8001/workflows/$WORKFLOW_ID/decisions \
  -H "Authorization: Bearer $MICHAEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "approved", "reason": "SOC 2 Type II verified. DPA signed. Approved for standard access."}'
```

**Show:**
- 403 on sarah.chen confirms RBAC enforcement
- `current_state: APPROVED` on michael.davidson confirms HITL decision recorded
- `approver: michael.davidson`, `approval_reason` persisted

### Step 7 — Show event history

```bash
curl http://localhost:8001/workflows/$WORKFLOW_ID/events \
  -H "Authorization: Bearer $MICHAEL_TOKEN"
```

**Show:** Complete event trail — WORKFLOW_INITIATED, DOCUMENTS_COLLECTED, SECURITY_REVIEW_COMPLETED, ROUTED_FOR_APPROVAL, APPROVAL_DECISION_RECEIVED, WORKFLOW_APPROVED. Each with actor, timestamp, trace_id.

---

## Iteration 3 — Resilience + Governance (v0.3-iteration-2)

**Story:** The system handles failure gracefully. Show retry, degraded mode, and idempotency.

### Step 8 — Trigger degraded mode

```bash
# Stop the RAG service
docker stop flowpilot-rag-service

# Submit a new workflow — should activate degraded mode
curl -X POST http://localhost:8001/workflows/ \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name": "DegradedVendor", "vendor_type": "saas", ...}'
```

**Show:**
- `"degraded": true` in response
- `policy_guidance` contains the structured questionnaire (7 questions) instead of RAG guidance
- `security_findings` includes "DEGRADED MODE — manual verification required"
- Structlog lines show 3 retry attempts then DegradedModeError

```bash
# Restart RAG service — normal mode resumes
docker start flowpilot-rag-service
```

### Step 9 — Test idempotency

```bash
IDEM_KEY="demo-$(date +%s)"

# First request
curl -X POST http://localhost:8001/workflows/ \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name": "IdempotentVendor", ...}'

# Second request — same key, different time
curl -X POST http://localhost:8001/workflows/ \
  -H "Authorization: Bearer $SARAH_TOKEN" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name": "IdempotentVendor", ...}'
```

**Show:** Both responses have identical `workflow_id`. No duplicate workflow created. Safe under network retry conditions.

### Step 10 — Show the audit trail

```bash
sqlite3 flowpilot_workflows.db \
  "SELECT timestamp, action, user_id, role, outcome FROM audit_log ORDER BY id DESC LIMIT 10;"
```

**Talking point:** Every access attempt — granted and denied — is in the audit log. Given any incident, reconstruct who accessed what, when, with what role, and what the outcome was.

---

## Iteration 4 — Vendor Registry (v1.9-vendor-registry)

**Story:** Browse the full vendor registry, observe role-aware controls, delete a vendor as policy_manager, update as procurement_manager.

**Login:** `lisa.vandenberg` (policy_manager) for delete actions · `sarah.chen` (procurement_manager) for update actions

### Vendor Registry (lisa.vandenberg / policy_manager)

1. Navigate to `/vendors` — full registry with status badges (Assessed = teal, Re-assessed = ↻, Pending Approval = amber)
2. Delete a vendor — confirm modal appears, row disappears on confirmation
3. Switch to `sarah.chen` (procurement_manager) — Update vendor triggers re-assessment workflow
4. Observe role-aware buttons: Delete is visible only to policy_manager; Update is accessible to procurement_manager

**Talking point:** RBAC bounds what each role can see and do — not just API-level but UI-level. A policy_manager JWT cannot trigger a workflow re-assessment; a procurement_manager JWT cannot delete a registry entry. Two separate role permissions, two separate action paths, enforced at both API and UI layers.

---

## Closing points for an architecture interview

1. **The HITL gate is structural, not policy.** The agent cannot hold a `security_approver` JWT. The state guard prevents decisions on non-PENDING_APPROVAL workflows. Two independent enforcement mechanisms.

2. **The RAG service knows nothing about vendors.** Ingest any domain's policy documents — it retrieves for that domain without code changes. The separation is demonstrable, not just claimed.

3. **Every ADR has a stated tradeoff.** Not "we chose Qdrant because it's good" — "we chose Qdrant over pgvector because of the hybrid retrieval requirement, accepting the operational overhead of an additional Docker service." See [ADR index](../adr/README.md).

4. **Mock mode is architectural, not a shortcut.** The full workflow — including observability, resilience, and governance — runs identically in mock mode. `FP_MOCK_MODE=true` replaces only the LLM and embedding calls. Everything else is real.
