# Skill: ADR Impact Review

## Purpose
When an ADR is added, updated, removed, or renumbered, perform a structured
impact review across all affected artefacts before making any changes.
Present findings to Nitindra. Wait for his approval before proceeding.
Never make changes without explicit go-ahead.

---

## Trigger Conditions

This skill activates when:
- A new ADR file is created in adr/
- An existing ADR is modified in content or status
- An ADR is renumbered (e.g. ADR-013 → ADR-014)
- An ADR is deprecated or deleted
- The ADR table in README.md is modified

---

## Impact Matrix

| ADR change | Artefacts to check |
|---|---|
| New ADR added | README.md ADR table, adr/README.md, Word docs (Architecture Requirements), Release History |
| ADR content updated | README.md ADR table description, Word docs, any diagram that references the ADR |
| ADR renumbered | README.md link + description, adr/README.md, all cross-references in other ADRs, diagrams, Word docs, CLAUDE.md |
| ADR deprecated/deleted | README.md (mark deprecated, do not delete row), adr/README.md, cross-references |

---

## Artefact Checklist

For every ADR change, check each artefact below and mark: AFFECTED / NOT AFFECTED / STALE

### 1. README.md (root)
- ADR table: link correct? description accurate? ADR count in Repository Map updated?
- Release History: does the release that introduced this ADR appear?
- Positioning statement: still consistent with the ADR decision?

### 2. adr/README.md
- Is the ADR listed with correct number, title, status, and layer label?
- Layer label must match: 🔵 RAG / 🟣 Agentic AI / 🟠 Shared / 🟡 Boundary

### 3. Architecture diagrams
Run impact check from diagram-update.md skill:
- New auth flow ADR → c4-level2-containers, happy-path-sequence
- New RAG ADR → c4-level3-rag-service, fig1-architecture
- New Agentic ADR → c4-level3-vendor-onboarding, sequence diagrams
- New infra ADR → deployment-architecture, azure-hub-spoke
- New shared ADR → c4-level2-containers

For each affected diagram:
- Does the diagram reflect the ADR decision?
- Does it follow FlowPilot color conventions (see diagram-update.md)?
- Is the Mermaid source (.md) in sync with the rendered image (.jpg/.png/.svg)?
- Present diagram findings to Nitindra before touching any image

### 4. Word documents
- FlowPilot-Architecture-Requirements-vX.X.docx: ADR section updated?
- FlowPilot-vX.X.docx: Functional phases updated if ADR changes scope?
- Version number in header/footer/title updated?

### 5. Cross-references in other ADRs
- Does any existing ADR reference the changed ADR by number?
- If renumbered: all cross-references must be updated

### 6. CLAUDE.md (per repo)
- Does CLAUDE.md reference the ADR in a decision rule?
- Example: "See ADR-012 — Keycloak is the identity provider"

### 7. Skills
- Does any .claude/skills/*.md reference this ADR?
- Example: azure-key-vault.md references ADR-012

### 8. Demo script
- Does demo/demo-script.md reference this ADR or the feature it governs?

---

## Review Output Format

Present findings to Nitindra in this format before making any changes:

    ADR IMPACT REPORT — ADR-XXX [Title]
    Change type: [Added / Updated / Renumbered / Deprecated]

    AFFECTED ARTEFACTS:
    - README.md — ADR table row needs updating (line XX)
    - adr/README.md — entry missing
    - c4-level2-containers.md — M2M auth flow not shown
    - docs/images/two-ai-paradigms.jpg — stale, needs regeneration
    - FlowPilot-Architecture-Requirements-v1.5.docx — ADR section outdated

    NOT AFFECTED:
    - deployment-architecture.jpg — no infrastructure change
    - agent-team-org.jpg — no team change

    DIAGRAM CHANGES REQUIRED:
    - c4-level2-containers: add vendor-onboarding-service → rag-service M2M arrow
    - Style: use RAG layer color (fill:#1a3a6a) for new node
    - Estimated impact: 2 diagrams, 1 SVG + 1 JPG

    AWAITING YOUR APPROVAL TO PROCEED.

---

## Style and Structure Rules for Diagram Updates

All diagram updates triggered by ADR changes must follow these non-negotiable rules:

### Color conventions (never deviate)
    RAG layer:        fill:#1a3a6a,color:#60a5fa,stroke:#2a5a9a
    Agentic AI layer: fill:#1a0f2e,color:#a78bfa,stroke:#2d1f5e
    Shared layer:     fill:#0d1225,color:#c8d8f0,stroke:#1c2340
    Boundary:         fill:#1f1a0a,color:#f59e0b,stroke:#3d3010
    External system:  fill:#0a1f12,color:#4ade80,stroke:#1a4028
    HITL gate:        fill:#1f1a0a,color:#f59e0b,stroke:#BA7517

### Layout rules
- Never rearrange existing nodes to accommodate a new one
- Add new nodes at the edge of their logical group
- Arrows flow left-to-right or top-to-bottom
- New arrows must not cross existing arrows if avoidable
- Label all new arrows with the protocol or action (e.g. "JWT / JWKS", "POST /query")

### Holistic structure rules
- Every diagram must remain readable at 1280px wide
- No diagram should show more than 12 nodes — if a new ADR pushes beyond this, flag it to Nitindra before rendering
- C4 diagrams must maintain C4 notation: Person, System, Container, Component shapes only
- Sequence diagrams must maintain vertical actor columns — never add horizontal actors

### What never changes without explicit Nitindra approval
- The overall layout direction (horizontal vs vertical)
- The grouping of components into swim lanes or boundaries
- The diagram title or subtitle
- Removal of any existing node, arrow, or label

---

## Commit Convention

ADR changes and their artefact updates must be in one commit:

    docs(adr): add ADR-016 Keycloak M2M client credentials

    - adr/ADR-016-keycloak-m2m-client-credentials.md (new)
    - adr/README.md: added ADR-016 entry
    - README.md: ADR table updated, count 15 → 16
    - c4-level2-containers.md: added M2M auth flow
    - docs/images/two-ai-paradigms.jpg: regenerated with M2M connection
    - FlowPilot-Architecture-Requirements-v1.6.docx: ADR-016 section added

Never split an ADR and its diagram update across two commits.

---

## Anti-patterns — Never Do These

- Never add an ADR file without updating the README.md ADR table
- Never renumber an ADR without updating all cross-references
- Never update a diagram without Nitindra's explicit approval first
- Never deviate from the color conventions — not even slightly
- Never change the holistic layout or structure of a diagram
- Never delete an ADR row from README.md — mark it deprecated instead
- Never commit a partial update (ADR file but no README update)
