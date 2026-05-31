# Skill: Demo Scenario Protection

## Purpose
The 5-act FlowPilot demo scenario is the backbone of the platform.
It is the single source of truth for end-to-end correctness.
Every UI change — no matter how small — must replay the full scenario
before any commit is allowed. A passing demo scenario is the only
acceptable definition of "UI done".

## Self-Contained Principle
The scenario creates its own data, runs, and tears it down.
No external pre-existing data dependencies. No pollution after the run.

  beforeAll → create NSCS BV → approve → Assessed
  test      → run all 5 acts
  afterAll  → delete Playwright Demo Vendor + NSCS BV

## When This Skill Applies
Trigger this skill whenever ANY of the following files are changed:
- Any file in src/scenes/
- Any file in src/components/
- Any file in src/pages/
- Any file in src/services/
- Any file in src/utils/
- Any file in src/App.jsx or src/main.jsx
- Any file in src/theme/ or src/styles/
- Any .env or vite.config.js

If in doubt: run the scenario. The cost of running it is 3 minutes.
The cost of shipping a broken demo is the entire portfolio.

## The 5 Protected Acts

### beforeAll — Data Setup (self-contained)
1. Health checks: Keycloak + API + UI all responding
2. Create NSCS BV via POST /vendors as sarah.chen
3. Poll until NSCS BV reaches PENDING_APPROVAL (max 4 min, poll every 5s)
4. Approve NSCS BV via POST /workflows/{id}/decisions as michael.davidson
5. Poll until NSCS BV display_status = "Assessed"
6. Store nscsVendorId for Acts 3, 4, 5

### Act 1 — Procurement Manager creates a vendor (sarah.chen)
Every element below must be present and interactable:

**Vendor Overview:**
- Table renders with NSCS BV row visible, status badge "Assessed"
- "+ New Vendor" button visible and clickable (exact label)

**Vendor Form — all fields with exact labels:**
- Vendor Name: text input, required (*)
- Vendor Type: dropdown — SaaS | On-Premises | Managed Service | Consulting | Other
- Access Level: dropdown — None | Read-Only | Read-Write | Privileged
- Data Classification: dropdown — Public | Internal | Confidential | Restricted
- Certifications: checkboxes — ISO 27001 | SOC 2 Type II | PCI DSS | GDPR | CSA STAR | ISO 9001
- Sub-processors: tag input, placeholder "Type name and press Enter to add"
- Description: textarea, optional (no asterisk)
- Business Justification: textarea, required (*)
- Submit button: "Create Workflow →" (exact text)

**After submission:**
- Capture workflow_id from POST /vendors response
- Redirect to Vendor Overview
- "Playwright Demo Vendor" row visible
- Status badge shows exactly "Pending Approval"
- Store act1WorkflowId for Act 2

**POST payload field name:** `name` (NOT `vendor_name`)

---

### Act 2 — Security Approver approves (michael.davidson)
**Approval Queue:**
- Navigate to /approval-queue?workflow_id={act1WorkflowId}
- Page heading: "Approval Queue"
- Subheading: "Human-in-the-loop security review"
- PENDING REVIEW count > 0
- "Playwright Demo Vendor" card visible
- AI findings section visible
- Approve button clickable

**After approval:**
- Navigate to Vendor Overview
- "Playwright Demo Vendor" status badge shows exactly "Assessed"

---

### Act 3 — Procurement Manager updates (sarah.chen)
**Vendor Overview:**
- NSCS BV row visible with Update button
- Update button NOT visible for lisa.vandenberg (verified in Act 5)

**Update form:**
- Click Update on NSCS BV row
- Form heading: "Update Vendor" (not "Create Vendor")
- All fields pre-populated with NSCS BV data
- Change Access Level
- Submit button present and functional

**After submission:**
- Success message: "Vendor re-submitted for approval"
- NSCS BV status shows "Pending Approval"
- Store nscsWorkflowId for Act 4

---

### Act 4 — Security Approver re-approves (michael.davidson)
**Approval Queue:**
- Navigate to /approval-queue?workflow_id={nscsWorkflowId}
- NSCS BV card visible
- Approve button clickable

**After re-approval:**
- Navigate to Vendor Overview
- NSCS BV status badge shows exactly "↻ Re-assessed"

---

### Act 5 — Policy Manager deletes (lisa.vandenberg) — CLOSING ACT
**RBAC checks:**
- Delete button visible on vendor rows
- Update button NOT visible on any row

**Delete modal — exact text:**
- Heading: "Delete Vendor"
- Body contains: "Playwright Demo Vendor" AND "This action cannot be undone"
- Cancel: closes modal, vendor still visible
- Delete/Confirm button: red, removes vendor from table

**After successful delete:**
- Modal closes
- "Playwright Demo Vendor" row no longer present
- No error message shown

### afterAll — Cleanup (self-contained)
Delete using lisa.vandenberg token:
1. DELETE /vendors/{playwriteDemoVendorId} if still exists
2. DELETE /vendors/{nscsVendorId}
Wrapped in try/catch — cleanup failure must not cause test failure.

---

## What the Scenario Checks Beyond Happy Path

| Category | What to check |
|---|---|
| Breadcrumbs | Exact text, correct order, clickable links |
| Nav links | Exact labels, correct routing per role |
| Form labels | Exact text including asterisk (*) for required fields |
| Button labels | Exact text — "Create Workflow →" not "Submit" |
| Status badges | Exact text — "Assessed" not "Approved", "↻ Re-assessed" not "Re-Assessed" |
| Error messages | Exact text for 409, 403, 404 responses |
| Modal text | Exact heading and body text |
| RBAC visibility | Which buttons appear for which roles |
| Redirects | Correct URL after each action |
| API field names | `name` not `vendor_name` |
| Timestamps | DD-MM-YY HH:MM CET format, never raw ISO |

## How to Run

```powershell
cd C:\Development\flowpilot\flowpilot-ui
npx playwright test e2e/demo-scenario.spec.js --headed
```

## Pass Criteria

| Criterion | Required |
|---|---|
| All 5 acts complete without stopping | ✅ mandatory |
| Zero test failures | ✅ mandatory |
| Video saved to test-results/videos/demo-scenario/ | ✅ mandatory |
| Video file size > 1MB | ✅ mandatory |
| No "Error Loading Workflow" visible | ✅ mandatory |
| No "Field required" error at form submit | ✅ mandatory |
| No blank pages during any scene transition | ✅ mandatory |
| DB clean after afterAll (no test data remains) | ✅ mandatory |

## Fail Protocol
1. Stop — do not commit
2. Read failure message and screenshot
3. Open the failing component and find the selector mismatch
4. Fix the component OR the spec (never delete an assertion)
5. Re-run full scenario from Act 1
6. Only commit when all 5 acts pass

## Impact Assessment Rule (MANDATORY before writing any code)

Before writing any code, every agent must assess whether planned
changes impact the 5-act demo scenario.

### Assessment Checklist

| Question | If YES |
|---|---|
| Does this change a button label, nav link, or breadcrumb text? | Update demo spec selectors |
| Does this change a form field label, placeholder, or field name? | Update demo spec fill logic |
| Does this add or remove a required form field? | Update demo spec to fill/skip it |
| Does this change a status badge text? | Update demo spec assertions |
| Does this change an API field name? | Update demo spec POST payload |
| Does this change a route or URL? | Update demo spec navigation |
| Does this change modal heading or body text? | Update demo spec modal assertions |
| Does this change RBAC visibility? | Update demo spec RBAC assertions |
| Does this change an error message? | Update demo spec error assertions |
| Does this change a redirect after submit? | Update demo spec waitForURL |

If ANY YES → update spec first, run scenario, then commit.
If ALL NO → run scenario anyway to confirm, then commit.

**There is no scenario where a UI commit is valid without a passing full scenario run.**

## Adding New Acts
When a new workflow use case is configured (ADR-021), add a new act.
Each configured use case gets its own act. The scenario grows with the platform.

## Integration With Delivery Flow
Add to every flowpilot-ui agent brief mandatory checklist:

  x. Complete impact assessment checklist (demo-scenario-protection.md)
  y. Update demo-scenario.spec.js if any checklist item is YES
  z. npx playwright test e2e/demo-scenario.spec.js --headed
     → all 5 acts must pass, video saved > 1MB
     → only then: git commit
