# Skill: Demo Scenario Protection

## Purpose
The 4-act FlowPilot demo scenario is the backbone of the platform.
It is the single source of truth for end-to-end correctness.
Every UI change — no matter how small — must replay the full scenario
before any commit is allowed. A passing demo scenario is the only
acceptable definition of "UI done".

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

## The 4 Protected Acts

### Act 1 — Procurement Manager creates a vendor (sarah.chen)
Every element below must be present and interactable:

**Navigation & breadcrumbs:**
- Breadcrumb: Home → visible and clickable
- Nav link: "Vendor Overview" visible after login
- Page heading on vendor form

**Vendor Overview:**
- Table renders with at least NSCS BV row visible
- NSCS BV status badge shows "Assessed"
- "New Vendor" button visible and clickable (exact label must match)

**Vendor Form — all fields must be present with exact labels:**
- Vendor Name: text input, required (*)
- Vendor Type: dropdown with options SaaS | On-Premises | Managed Service | Consulting | Other
- Access Level: dropdown with options None | Read-Only | Read-Write | Privileged
- Data Classification: dropdown with options Public | Internal | Confidential | Restricted
- Certifications: checkboxes — ISO 27001 | SOC 2 Type II | PCI DSS | GDPR | CSA STAR | ISO 9001
- Sub-processors: tag input with placeholder "Type name and press Enter to add"
- Description: textarea, optional (no asterisk)
- Business Justification: textarea, required (*)
- Submit button label: "Create Workflow →" (exact text)

**After submission:**
- Redirect to Vendor Overview
- New vendor row visible
- Status badge shows exactly "Pending Approval"

**POST payload field name:** `name` (NOT `vendor_name`)

---

### Act 2 — Security Approver approves (michael.davidson)
Every element below must be present and interactable:

**Navigation:**
- Logout button visible and functional
- Login as michael.davidson succeeds
- Nav shows Approval Queue link

**Approval Queue:**
- Page heading: "Approval Queue"
- Subheading: "Human-in-the-loop security review"
- PENDING REVIEW count > 0
- Vendor card visible with correct vendor name
- workflow_id present in URL or page state
- AI findings section visible
- Approve button present and clickable
- Reject button present and clickable

**After approval:**
- Navigate to Vendor Overview
- Vendor status badge shows exactly "Assessed"

---

### Act 3 — Policy Manager deletes a vendor (lisa.vandenberg)
Every element below must be present and interactable:

**RBAC checks:**
- Delete button visible on vendor rows
- Update button NOT visible on any row (lisa cannot update)

**Delete modal — exact text must match:**
- Modal heading: "Delete Vendor"
- Modal body contains: vendor name AND "This action cannot be undone"
- Cancel button: closes modal, vendor still visible in table
- Delete/Confirm button: red, removes vendor from table

**After successful delete:**
- Modal closes
- Vendor row no longer present in table
- No error message shown

---

### Act 4 — Re-assessment flow (sarah.chen + michael.davidson)
Every element below must be present and interactable:

**Update flow (sarah.chen):**
- Update button visible on NSCS BV row
- Clicking Update navigates to vendor form
- Form heading changes to "Update Vendor" (not "Create Vendor")
- All fields pre-populated with NSCS BV data
- Vendor name field pre-filled (read: contains "NSCS")
- Access Level field shows existing value
- Submit button present and functional

**After update submission:**
- Success message visible: "Vendor re-submitted for approval"
- NSCS BV status shows "Pending Approval"

**Re-approval (michael.davidson):**
- NSCS BV visible in Approval Queue
- Approve button functional

**After re-approval:**
- NSCS BV status badge shows exactly "↻ Re-assessed"

---

## What the Scenario Checks Beyond Happy Path

Every run of the demo scenario must verify:

| Category | What to check |
|---|---|
| Breadcrumbs | Exact text, correct order, clickable links |
| Nav links | Exact labels, correct routing per role |
| Form labels | Exact text including asterisk (*) for required fields |
| Button labels | Exact text — "Create Workflow →" not "Submit" |
| Status badges | Exact text — "Assessed" not "Approved", "Re-assessed" not "Re-Assessed" |
| Error messages | Exact text for 409, 403, 404 responses |
| Modal text | Exact heading and body text |
| RBAC visibility | Which buttons appear for which roles |
| Redirects | Correct URL after each action |
| API field names | `name` not `vendor_name`, `display_status` not `status` |
| Timestamps | DD-MM-YY HH:MM CET format, never raw ISO |

## How to Run

```powershell
cd C:\Development\flowpilot\flowpilot-ui
npx playwright test e2e/demo-scenario.spec.js --headed
```

## Pass Criteria

| Criterion | Required |
|---|---|
| All 4 acts complete without stopping | ✅ mandatory |
| Zero test failures | ✅ mandatory |
| Video saved to test-results/videos/demo-scenario/ | ✅ mandatory |
| Video file size > 1MB | ✅ mandatory (proves recording ran) |
| No "Error Loading Workflow" visible | ✅ mandatory |
| No "Field required" error at form submit | ✅ mandatory |
| No blank pages during any scene transition | ✅ mandatory |

## Fail Protocol

If the scenario fails at any act:
1. Stop — do not commit
2. Read the failure message and screenshot
3. Open the failing component and find the selector mismatch
4. Fix the component OR the spec selector (never delete an assertion)
5. Re-run the full scenario from Act 1
6. Only commit when all 4 acts pass

## Adding New Scenarios

When a new workflow use case is configured (ADR-021 — configurable
platform), add a new act to this spec. Each configured use case gets
its own act. The demo scenario grows with the platform.

## Integration With Delivery Flow

This skill is mandatory in every flowpilot-ui agent brief.
Add to every brief's mandatory checklist:

```
x. npx playwright test e2e/demo-scenario.spec.js --headed
   → all 4 acts must pass
   → video saved and > 1MB
   → only then: git commit
```

No UI commit is valid without a passing demo scenario run.
