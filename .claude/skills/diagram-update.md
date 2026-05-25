# Skill: Architecture Diagram Update

## Purpose
Maintain FlowPilot architecture diagrams in sync with the codebase. When a new
component, ADR, service, or flow is added, perform an impact assessment to
determine which diagrams are affected and present the findings to Nitindra
before making any changes. Unless he decides otherwise, all affected diagrams
must be updated in the same commit as the triggering change. Never ship a code
change that makes a diagram stale.

---

## Diagram Inventory

| File | Source | Type | Updated when |
|------|--------|------|--------------|
| `docs/images/two-ai-paradigms.jpg` | `architecture/c4-level2-containers.md` | Mermaid → JPG | RAG or Agentic layer changes |
| `docs/images/fig1-architecture.png` | `architecture/c4-level3-rag-service.md` | Mermaid → PNG | RAG internals change |
| `docs/images/fig2-repo-mapping.png` | `architecture/c4-level2-containers.md` | Mermaid → PNG | Repo structure changes |
| `docs/images/deployment-architecture.jpg` | `architecture/deployment.md` | Mermaid → JPG | Infrastructure changes |
| `docs/images/azure-hub-spoke.jpg` | `architecture/deployment.md` | Mermaid → JPG | Azure pattern changes |
| `docs/images/agent-team-org.jpg` | `.claude/TEAM.md` | Mermaid → JPG | Agent team changes |
| `docs/images/traceability.jpg` | `architecture/happy-path-sequence.md` | Mermaid → JPG | Audit/event changes |
| `architecture/c4-level1-context.svg` | `architecture/c4-level1-context.md` | Mermaid → SVG | System boundary changes |
| `architecture/c4-level2-containers.svg` | `architecture/c4-level2-containers.md` | Mermaid → SVG | Container changes |
| `docs/images/screenshots/*.png` | Live UI (Playwright) | Screenshot | UI scene changes |

---

## Rules — Always Follow These

### Rule 1 — Source first, image second
Always update the Mermaid .md source file BEFORE generating the image.
Never edit a JPG/PNG directly. The .md is the source of truth.

### Rule 2 — Preserve layout and color coding
When adding a new component to an existing diagram:
- Match the existing node shape convention ([rect], ([cylinder]), {diamond})
- Match the existing color scheme — do NOT introduce new colors
- Place the new component in the logical position relative to existing components
- Preserve all existing arrows, labels, and groupings

FlowPilot color conventions:

    RAG layer:        fill:#1a3a6a,color:#60a5fa,stroke:#2a5a9a
    Agentic AI layer: fill:#1a0f2e,color:#a78bfa,stroke:#2d1f5e
    Shared layer:     fill:#0d1225,color:#c8d8f0,stroke:#1c2340
    Boundary:         fill:#1f1a0a,color:#f59e0b,stroke:#3d3010
    External system:  fill:#0a1f12,color:#4ade80,stroke:#1a4028
    HITL gate:        fill:#1f1a0a,color:#f59e0b,stroke:#BA7517

### Rule 3 — Render to image, overwrite existing file
After updating the Mermaid source, render to image and overwrite the existing
file at the EXACT same path with the EXACT same filename. Never rename.

### Rule 4 — Impact assessment before editing
Before touching any diagram, assess impact and present findings to Nitindra:

    Which diagrams are affected by this change?
    - New service/repo         → c4-level2-containers, fig2-repo-mapping
    - New ADR                  → README ADR table only (no diagram)
    - New LangGraph node       → c4-level3-vendor-onboarding, sequence diagrams
    - New RAG component        → c4-level3-rag-service, fig1-architecture
    - New auth flow            → happy-path-sequence, c4-level2-containers
    - New UI scene             → screenshots only
    - New agent in team        → agent-team-org
    - New Azure component      → deployment-architecture, azure-hub-spoke

Present the impact list to Nitindra as findings before proceeding.
Wait for his go-ahead before making any diagram changes.

---

## Rendering Pipeline

### Step 1 — Install renderer (once per environment)

    npm install -g @mermaid-js/mermaid-cli

Verify:

    mmdc --version

### Step 2 — Update Mermaid source
Edit the .md file containing the Mermaid block. Add the new component
following Rule 2 (preserve layout and color coding).

### Step 3 — Extract Mermaid block to temp file

    $content = Get-Content architecture/c4-level2-containers.md -Raw
    $mermaid = [regex]::Match($content, '```mermaid\r?\n([\s\S]*?)```').Groups[1].Value
    $mermaid | Out-File -FilePath temp-diagram.mmd -Encoding utf8

### Step 4 — Render to image

    # JPG
    mmdc -i temp-diagram.mmd -o docs/images/two-ai-paradigms.jpg -t dark -b transparent

    # PNG
    mmdc -i temp-diagram.mmd -o docs/images/fig1-architecture.png -t dark -b transparent

    # SVG
    mmdc -i temp-diagram.mmd -o architecture/c4-level1-context.svg -t dark -b transparent

### Step 5 — Verify output

    Get-Item docs/images/two-ai-paradigms.jpg | Select-Object Name, LastWriteTime, Length

### Step 6 — Clean up

    Remove-Item temp-diagram.mmd

---

## Screenshot Update Pipeline

When UI scenes change, update screenshots using Playwright:

    const { chromium } = require('playwright');

    const SCENES = [
      { url: 'http://localhost:3000',                      file: '01-operational-homepage.png' },
      { url: 'http://localhost:3000/vendor-form',          file: '02-vendor-form.png' },
      { url: 'http://localhost:3000/workflow-progress/:id',file: '03-workflow-progress.png' },
      { url: 'http://localhost:3000/policy-retrieval/:id', file: '04-policy-retrieval.png' },
      { url: 'http://localhost:3000/security-findings/:id',file: '05-security-findings.png' },
      { url: 'http://localhost:3000/approval-queue',       file: '06-approval-queue.png' },
      { url: 'http://localhost:3000/workflow-complete/:id',file: '07-workflow-complete.png' },
      { url: 'http://localhost:3000/audit-trail/:id',      file: '08-audit-trail.png' },
      { url: 'http://localhost:3000/architecture',         file: '09-architecture.png' },
    ];

    // Screenshots overwrite existing files at the same path — same filename, never renamed.

---

## Quality Gate

Before committing any diagram update:

- [ ] Impact assessment presented to Nitindra and approved
- [ ] Mermaid .md source updated first
- [ ] New component uses existing color conventions — no new colors introduced
- [ ] Image rendered and overwrites existing file at same path and filename
- [ ] Image opens correctly and new component is visible
- [ ] No other diagram references the changed component without being updated
- [ ] README image references still point to correct filenames
- [ ] temp-diagram.mmd deleted

---

## Commit Convention

Always bundle diagram updates with the feature that triggered them:

    feat(auth): Keycloak M2M client credentials for RAG service calls

    - token_cache.py: RFC 6749 §4.4 client_credentials grant
    - Updated c4-level2-containers.md: added M2M auth flow
    - Updated docs/images/two-ai-paradigms.jpg: reflects M2M connection
    - Added ADR-016

Never commit a diagram update in isolation unless it is a documentation-only fix.

---

## Anti-patterns — Never Do These

- Never edit a JPG/PNG directly in any image editor
- Never introduce new colors not in the FlowPilot color convention
- Never rename an existing image file (breaks all README references)
- Never ship a code change without updating affected diagrams
- Never generate a diagram with a white background (use -b transparent)
- Never commit a temp .mmd file to the repo
- Never update README image references without updating the actual image
