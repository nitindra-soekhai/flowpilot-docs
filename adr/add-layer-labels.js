#!/usr/bin/env node
// Run from: C:\Development\flowpilot\flowpilot-docs\adr\
// Usage: node add-layer-labels.js
// Then: git add . && git commit -m "docs: add AI paradigm layer labels to all ADRs" && git push origin dev

const fs = require('fs');
const path = require('path');

const layers = {
  'ADR-001': { label: '🔵 RAG', note: 'Applies to flowpilot-rag-service. The vector store is only accessed by the retrieval pipeline — the agentic layer never calls Qdrant directly.' },
  'ADR-002': { label: '🔵 RAG', note: 'Retrieval strategy decision within flowpilot-rag-service. The agentic layer calls POST /query and receives results; it has no knowledge of dense or sparse vectors.' },
  'ADR-003': { label: '🟣 Agentic AI', note: 'LangGraph is the orchestration engine for the vendor assessment state machine in flowpilot-vendor-onboarding. The RAG service does not use LangGraph.' },
  'ADR-004': { label: '🟣 Agentic AI', note: 'HITL is a governance boundary within the agentic workflow. The LangGraph agent pauses at the request_approval node and waits for a human decision. RAG is stateless and has no HITL concept.' },
  'ADR-005': { label: '🟣 Agentic AI', note: 'Workflow state persistence is an agentic concern. The agent must remember where it is in the multi-step process across the HITL suspension. The RAG service is stateless and uses no persistent state store.' },
  'ADR-006': { label: '🟢 Shared — RAG + Agentic AI', note: 'Both flowpilot-rag-service and flowpilot-vendor-onboarding use FastAPI. The framework decision applies to the entire backend.' },
  'ADR-007': { label: '🟡 Boundary decision — defines the RAG ↔ Agentic AI split', note: 'RAG lives in flowpilot-rag-service. Agentic orchestration lives in flowpilot-vendor-onboarding. The agent calls RAG as a tool over HTTP — POST /query with Bearer token. Neither service has a compile-time dependency on the other.' },
  'ADR-008': { label: '🟢 Shared — RAG + Agentic AI', note: 'The domain choice affects both layers. The RAG service ingests vendor onboarding policy documents. The agentic layer orchestrates the vendor onboarding workflow.' },
  'ADR-009': { label: '🟢 Shared — RAG + Agentic AI', note: 'FP_MOCK_MODE=true bypasses OpenAI calls in the RAG service (mock retrieved chunks) and in the agentic layer (mock security findings). Note: in flowpilot-vendor-onboarding, FP_MOCK_MODE=true also bypasses Keycloak JWKS validation — set to false for real authentication.' },
  'ADR-010': { label: '🟢 Shared — RAG + Agentic AI', note: 'structlog JSON logging applies to both services. The RAG service logs retrieval metrics (chunk scores, latency, confidence_met). The agentic layer logs workflow state transitions and 11 audit event types. Both share trace_id format for cross-service correlation.' },
  'ADR-011': { label: '🔵 RAG', note: 'Reranking is a retrieval quality concern within the RAG pipeline. The agentic layer is unaffected — it receives retrieval results regardless of whether a reranking step is present.' },
  'ADR-012': { label: '🟢 Shared — RAG + Agentic AI', note: 'Both backend services (RAG and Agentic AI) validate Keycloak JWTs via the JWKS endpoint. Role-based access controls which workflow actions the agentic layer may execute and which queries the RAG service will serve.' },
};

const adrDir = __dirname;
const files = fs.readdirSync(adrDir).filter(f => f.endsWith('.md') && f.startsWith('ADR-'));

let updated = 0;
let skipped = 0;

for (const file of files) {
  const adrKey = file.match(/ADR-\d+/)?.[0];
  if (!adrKey || !layers[adrKey]) {
    console.log(`⚠️  No layer defined for ${file} — skipped`);
    skipped++;
    continue;
  }

  const filePath = path.join(adrDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has Layer field
  if (content.includes('**Layer:**')) {
    console.log(`✓ ${file} already has Layer label — skipped`);
    skipped++;
    continue;
  }

  const { label, note } = layers[adrKey];
  const layerLine = `\n**Layer:** ${label}\n> ${note}\n`;

  // Insert after the first **Status:** line
  if (content.includes('**Status:**')) {
    content = content.replace(/(\*\*Status:\*\*[^\n]*\n)/, `$1${layerLine}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file} → ${label}`);
    updated++;
  } else {
    // Fallback: insert after the first heading
    content = content.replace(/(^# .+\n)/, `$1${layerLine}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file} (fallback) → ${label}`);
    updated++;
  }
}

console.log(`\nDone — ${updated} updated, ${skipped} skipped.`);
console.log('\nNext steps:');
console.log('  git add .');
console.log('  git commit -m "docs: add AI paradigm layer labels to all ADRs"');
console.log('  git push origin dev');
