# Skill: E2E Test Architecture

## Purpose
Defines how end-to-end tests are structured in FlowPilot.
Poorly designed E2E tests are the #1 source of session rework.
This skill prevents 15+ iteration loops when E2E architecture is
not agreed upfront.

## Self-Contained Principle (non-negotiable)
Every E2E test that requires data must create its own data and delete it.
No test may depend on data created by a human, a prior run, or another file.

```
beforeAll → create all required data
test      → run scenario
afterAll  → delete everything created by this run (try/catch — never fails suite)
```

## Data Creation Strategy

### Backend tests (pytest + httpx)
Use the API with real auth tokens. Never insert directly into SQLite from
pytest — use the API so validation and audit logging fire correctly.

### Frontend tests (Playwright) — pre-condition data
**Use direct SQLite seed via docker exec. Never use the API for pre-condition
data involving the AI pipeline (LangGraph findings = 2-8 min wait).**

Complete working example for the vendors table:
```python
seedScript = """
import sqlite3, json, uuid
from datetime import datetime
DB = '/app/data/workflows.db'
conn = sqlite3.connect(DB)
conn.execute("DELETE FROM vendors WHERE name LIKE 'Test%' OR name LIKE '%probe%' OR name LIKE 'NSCS%'")
vid = str(uuid.uuid4())
conn.execute(
    'INSERT INTO vendors (id, name, vendor_type, access_level, data_classification, certifications, sub_processors, status, assessment_count, created_at, approved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    (vid, 'NSCS BV', 'SaaS', 'Read-Only', 'Confidential',
     json.dumps(['ISO 27001']), json.dumps(['AWS']),
     'APPROVED', 0,
     datetime.utcnow().isoformat(), datetime.utcnow().isoformat())
)
conn.commit()
conn.close()
print(vid)
""".strip()

vid = execSync('docker exec -i flowpilot-vendor-onboarding python3', {
  input: seedScript, encoding: 'utf8', timeout: 15_000
}).trim()
```

**API vs SQLite seed decision:**
- API: when the test IS testing the API (CRUD, validation, auth)
- SQLite: when the test needs pre-condition data not under test

## Selector Strategy (Playwright)

### Rule 1: Read the component before writing selectors
Never guess. Read the actual JSX file. If data-testid is missing from an
interactive element → ADD it to the component, then use it in the test.
Do NOT fall back to class or CSS selectors — they break on refactor.

### Rule 2: Prefer data-testid for interactive elements
```js
page.getByTestId('approval-queue-btn')          // preferred
page.getByRole('button', { name: /Approve/i })  // acceptable
page.locator('.some-class')                      // never use
```

### Rule 3: Exact text match for table rows
Prevent substring collision (e.g. "NSCS BV Probe3" matching "NSCS BV"):
```js
page.locator('[data-testid="vendor-row"]')
  .filter({ has: page.locator('td').getByText(vendorName, { exact: true }) })
```

### Rule 4: Status code filter on waitForResponse
Skip 307 redirects — filter by final response status:
```js
page.waitForResponse(r =>
  r.url().includes('/vendors') &&
  r.request().method() === 'POST' &&
  r.status() === 201
)
```

### Rule 5: Heading vs breadcrumb disambiguation
```js
await expect(page.getByRole('heading', { name: 'Approval Queue' }))
  .toBeVisible()  // won't match breadcrumb span
```

### Rule 6: Route intercept for capturing response data
When you need to capture workflow_id from a PUT response:
```js
let capturedWorkflowId = null
await page.route(`${API_BASE}/vendors/**`, async (route) => {
  if (route.request().method() === 'PUT') {
    const response = await route.fetch()
    const body = await response.json()
    capturedWorkflowId = body.workflow_id ?? null
    await route.fulfill({
      status: response.status(),
      headers: Object.fromEntries(response.headers()),
      body: JSON.stringify(body)
    })
  } else {
    await route.continue()
  }
})
// ... trigger the PUT action ...
await page.unroute(`${API_BASE}/vendors/**`)
```

## beforeAll Architecture
```js
test.beforeAll(async () => {
  test.setTimeout(60_000)  // NOT 600_000 — long timeouts hide problems
  const ctx = await request.newContext()
  const kc  = await ctx.get('http://localhost:8080/realms/flowpilot').then(r => r.ok()).catch(() => false)
  const api = await ctx.get('http://localhost:8001/health').then(r => r.ok()).catch(() => false)
  const ui  = await ctx.get('http://localhost:3000').then(() => true).catch(() => false)
  await ctx.dispose()
  if (!kc || !api || !ui) { skipReason = 'live stack not available'; return }
  // seed data here via SQLite
  stackUp = true
})
```

## Demo Scenario Specifics
The 5-act demo scenario uses:
- `slowMo: 800` on chromium.launch() — makes actions readable on video
- `recordVideo: { dir: 'test-results/videos/demo-scenario/', size: { width: 1280, height: 720 } }`
- `context.close()` in finally block — flushes and saves the video
See demo-scenario-protection.md for the full 5-act specification.

## When E2E Tests Must Be Updated
Before committing any component change that affects:
- Selector (button label, input ID, data-testid, placeholder)
- Redirect (which URL follows which action)
- Status badge text ("Assessed" not "Approved")
- API field name (name not vendor_name)
- RBAC visibility (which buttons appear for which role)

Update the E2E spec FIRST. Run full suite. Only commit when all pass.

## Coverage Rule
Every bug fix must include an E2E test that would have caught the bug.
No fix is complete without its test. Non-negotiable.
