---
name: flowpilot-artefact-update
description: "Use this skill whenever asked to update FlowPilot portfolio documents (FRS, Architecture Requirements, Build Plan, Activity Plan, or any versioned .docx artefact). Never rebuild from scratch. Always unpack the original, add on top, repack."
---

# Updating FlowPilot Portfolio Artefacts

## The Rule

**Always update, never rebuild.** When asked to update a FlowPilot document, start from the uploaded original. Unpack it, add new content on top, repack. Every formatting decision, table style, heading style, ADR format, and section structure from the original must be preserved exactly.

## Why

The originals were carefully formatted. Rebuilding from scratch produces documents that look visually different, lose style inheritance, lose heading numbering, lose table borders, and lose the document's established identity. The original IS the source of truth.

## Mandatory workflow

```bash
# 1. Copy original and scripts
cp /mnt/user-data/uploads/FlowPilot-xxx-v1.1.docx /home/claude/original.docx
cp -r /mnt/skills/public/docx/scripts /home/claude/scripts

# 2. Unpack
python scripts/office/unpack.py original.docx unpacked/

# 3. Study the XML before editing
#    - Find exact insertion points using grep
#    - Inspect 20+ lines of context around each anchor
#    - Match existing paragraph styles, font sizes, colors exactly

# 4. Add content — never remove or replace existing content
#    - Use Python string replacement with unique anchors
#    - Verify each anchor exists before replacement (assert)
#    - Match existing XML structure exactly

# 5. Fix common XML issues
#    - Escape < > & in text: &lt; &gt; &amp;
#    - paraId values must be < 0x80000000
#    - w:shd must come before w:spacing in w:pPr
#    - Never create orphaned <w:p> opening tags

# 6. Repack and validate
python scripts/office/pack.py unpacked/ output.docx --original original.docx
# Must show: All validations PASSED!
```

## What to add vs what to preserve

| Action | Rule |
|---|---|
| New section | Add after the last existing section of that type |
| New ADR | Add as a new table matching existing ADR table structure exactly |
| New table row | Add inside the existing table before </w:tbl> |
| New bullet | Add as a ListParagraph with matching numId |
| Version number | Update in header/footer/title only, not in section content |
| Release history | Add new entry AFTER the most recent existing entry |

## Common pitfalls

- **Orphaned `<w:p>` tag**: When replacing an anchor that is INSIDE a `<w:p>` (not including the opening tag), and prepending a new `<w:p>`, the original `<w:p>` becomes orphaned. Fix: remove the original `<w:p>` opening tag.
- **`<name>` in URLs**: XML interprets `<name>` as a tag. Escape as `&lt;name&gt;`.
- **`{job_id}` in paths**: Curly braces are safe in XML but check for any `<` or `>`.
- **`w:shd` ordering**: In `<w:pPr>`, `<w:shd>` must come before `<w:spacing>`.
- **paraId too large**: Custom paraId values starting with A-F hex may exceed 0x7FFFFFFF. Prefix with 1 to stay in range (e.g. `A0123456` → `1A123456`).

## FlowPilot ADR table structure

Each ADR is a standalone single-column table (9360 DXA wide) with:
- Blue border (color="2563EB") 
- Blue-tint background (fill="DBEAFE")
- Title paragraph: bold, color 1F3864, sz 26
- Layer/status paragraph: italic, color 595959, sz 20
- Context/Decision/Alternatives/Tradeoff: bold blue label (color 2E75B6) + normal text paragraph

## FlowPilot Technology Choices table structure

Three-column table (2200 + 1600 + 5560 DXA):
- Area | Paradigm | Technology
- Alternating shading: FFFFFF and F2F2F2
- All text: Arial, sz 20, color 000000, b=false
