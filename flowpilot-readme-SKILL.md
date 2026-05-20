# FlowPilot README — Protection & Edit SKILL.md

**File:** `flowpilot-docs/README.md`
**Owner:** Nitindra Soekhai · NSCS B.V.
**Purpose:** Guard the README against unintended changes during any AI-assisted edit session.

---

## 0. Pre-Edit Checklist (mandatory before touching the file)

1. Read the FULL current README before any edit — never patch blind
2. Confirm the exact section being changed with Nitindra
3. State what will change and what will NOT change
4. Get explicit approval before writing
5. After edit: verify section order, encoding, header/footer, diagram presence

---

## 1. Section Order — MUST be preserved unless explicitly changed

Current canonical order (do NOT reorder without explicit instruction):

1. `# FlowPilot — Enterprise AI Orchestration Platform` (H1 title)
2. `## What FlowPilot Demonstrates`
3. `## Live Demo — Full User Journey`
4. `## AI Development Team`
5. `## Why This Architecture?`
6. `## Enterprise Concerns`
7. `## Why Agents Are Not Always the Answer`
8. `## Architecture`
9. `## Deployment Architecture`
10. `## FlowPilot in the Azure AI Hub/Spoke Ecosystem`
11. `## Mapping to Azure AI Reference Architecture`
12. `## Governance Boundaries`
13. `## Traceability — Every AI Decision Is Reconstructable`
14. `## Retrieval Scoring & Confidence`
15. `## Operational Resilience`
16. `## Production Readiness`
17. `## Known Limitations & Tradeoffs`
18. `## Architecture Decision Records`
19. `## Engineering Proof`
20. `## Repository Map`
21. `## Stack`
22. `## How to Run`
23. `## Release History`
24. Footer line: `*FlowPilot · NSCS B.V. · Built by Nitindra Soekhai · May 2026*`

Verify with: `grep -n "^## " README.md`

---

## 2. Header & Footer Rules

- **Exactly one H1** (`# FlowPilot — Enterprise AI Orchestration Platform`) at line 1
- **Exactly one footer** (`*FlowPilot · NSCS B.V. · Built by Nitindra Soekhai · May 2026*`) at the very end
- No duplicate H1 headings anywhere in the file
- No second footer or closing banner

Verify: `grep -c "^# " README.md` must return `1`

---

## 3. Diagram Rules — Style & Color Must Be Preserved

### 3a. Mermaid Diagrams (3 diagrams in the README)

**Two AI Paradigms** (`## Architecture`):
- classDef colors are fixed — do NOT change hex values:
  - `rag` → `fill:#0e7490,stroke:#06b6d4,color:#fff`
  - `agentic` → `fill:#7c3aed,stroke:#8b5cf6,color:#fff`
  - `hitl` → `fill:#b45309,stroke:#f59e0b,color:#fff`
  - `shared` → `fill:#1d4ed8,stroke:#3b82f6,color:#fff`
  - `done` → `fill:#065f46,stroke:#10b981,color:#fff`
  - `blocked` → `fill:#7f1d1d,stroke:#ef4444,color:#fff`
- Subgraph backgrounds: `fill:#fffde7,stroke:#aaaa33` (light yellow — preserved via `style` declarations)
- Boundary arrow: `linkStyle 13,14 stroke:#eab308,stroke-width:3px` (yellow, ADR-007)

**Deployment Architecture** (`## Deployment Architecture`):
- Same classDef set (rag, agentic, hitl, shared)
- All subgraphs: `fill:#fffde7,stroke:#aaaa33`
- Boundary arrow: `linkStyle 10 stroke:#eab308,stroke-width:3px`

**Azure Hub/Spoke** (`## FlowPilot in the Azure AI Hub/Spoke Ecosystem`):
- Same classDef set
- All subgraphs: `fill:#fffde7,stroke:#aaaa33`
- Boundary arrow: `linkStyle 6 stroke:#eab308,stroke-width:3px`

### 3b. Color Coding Taxonomy (ADR layer labels — do not change)
| Color | Class | Represents |
|---|---|---|
| Teal `#0e7490` | `rag` | RAG paradigm — flowpilot-rag-service |
| Purple `#7c3aed` | `agentic` | Agentic AI — flowpilot-vendor-onboarding |
| Amber `#b45309` | `hitl` | HITL gate + Security & Governance |
| Blue `#1d4ed8` | `shared` | Shared infrastructure and platform |
| Yellow `#eab308` | boundary arrow | ADR-007 cross-service boundary |

### 3c. JPG Image (AI Development Team)
- Reference: `![AI Development Team](docs/images/agent-team-org.jpg)`
- File lives at: `flowpilot-docs/docs/images/agent-team-org.jpg`
- Do NOT change to SVG, PNG, or Mermaid — JPG only
- Do NOT change the image path or alt text without explicit instruction

---

## 4. Content Preservation Rules

- **All existing content must remain** unless Nitindra explicitly requests a change
- Do NOT summarise, shorten, or paraphrase existing paragraphs
- Do NOT remove table rows, ADR entries, screenshot steps, or capability descriptions
- Do NOT change technical values: port numbers, env var names, version strings, command syntax
- Do NOT add new sections without explicit instruction
- Do NOT reword section headings without explicit instruction

---

## 5. Encoding & Character Rules

- File encoding: **UTF-8**
- Line endings: **CRLF** (Windows, as this is a Windows repo) — preserve as-is
- **No mojibake** — after any edit, check for garbled characters (`â€"` instead of `—`, `â†'` instead of `→`)
- Em dashes must be real em dashes (`—`), not `--` or `â€"`
- Arrows must be real arrows (`→`, `←`) or Mermaid syntax (`-->`) — not escaped sequences
- Verify after edit: `grep -P "[\x80-\xFF]" README.md` — any hit outside of expected Unicode is a warning

---

## 6. Mermaid Diagram Integrity Rules

- Do NOT add, remove, or rename nodes without explicit instruction
- Do NOT change edge labels (connection text like `"POST /query + trace_id"`)
- Do NOT change subgraph names or their quoted labels
- Do NOT change `direction` declarations inside subgraphs
- `linkStyle` indices are position-dependent — if any connection is added or reordered, ALL linkStyle indices must be recalculated
- Always count link indices from 0, in the order they appear in the diagram code
- Subgraph `style` declarations must appear AFTER all connections in the diagram

---

## 7. Agent Names (AI Development Team section)

Current canonical agent names — do NOT abbreviate or rename without instruction:

| Domain | Canonical Name |
|---|---|
| Engineering | Enterprise Retrieval agent |
| Engineering | Vendor Onboarding agent |
| Quality | Security agent |
| Quality | QA agent |
| Operations | Infra agent |
| Operations | DevOps agent |
| Platform | Frontend Experience agent |
| Platform | Middleware agent |
| Data | Database agent |
| Data | MLOps agent |
| Insight | Analyst agent |
| Insight | Architecture Knowledge agent |
| Insight | Analytics agent |

---

## 8. Governance Framing (AI Development Team section)

The opening of `## AI Development Team` MUST contain this exact framing:

> "FlowPilot explores governed multi-agent collaboration patterns for enterprise AI delivery, operations, onboarding workflows, governance, and platform engineering."

Do NOT replace with "13 autonomous AI agents" or any wording that implies full autonomy.
The section must also contain: "This is governed collaboration, not autonomous AI."

---

## 9. ADR Table Rules

- 12 ADRs listed (ADR-001 through ADR-012)
- Each row has: link, layer emoji, decision text
- Layer emojis: 🔵 RAG, 🟣 Agentic AI, 🟠 Shared, 🟡 Boundary
- Do NOT add, remove, or reorder ADR rows without explicit instruction
- Do NOT change the ADR file paths in the links

---

## 10. Screenshot Steps (Live Demo section)

- 9 screenshot steps (Step 1 through Step 7, with two images in Step 3 and Step 7)
- Each step has: heading, image reference, blockquote description
- Image paths are under `docs/images/screenshots/` — do NOT change filenames
- Do NOT add or remove steps without explicit instruction

---

## 11. How to Apply an Edit

1. Read full README first
2. Identify ONLY the lines that need to change
3. Use `str_replace` with the smallest possible diff
4. For section reordering: use Python string manipulation — never manual line-by-line editing
5. After every edit, verify:
   - `grep -n "^## " README.md` → confirm section order
   - `grep -c "^# " README.md` → must return 1
   - `wc -l README.md` → note before/after line count
   - Check first and last 5 lines for header/footer integrity

---

## 12. What Requires Explicit Nitindra Approval

- Any section reordering
- Any new section added
- Any diagram node/edge change
- Any classDef color change
- Any agent rename
- Any content removal (even partial)
- Changing the JPG to another format
- Changing the footer text
- Changing the H1 title
