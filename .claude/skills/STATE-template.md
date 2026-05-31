# STATE.md — [REPO NAME]

## Purpose
Living current-state document per repo. Updated at the end of every session.
Fed into every new session alongside FRS and Architecture Requirements.
Prevents coordinator memory drift as the codebase grows.

---

## Version
Current tag: [v1.x-tag-name]
Branch: dev (ahead of main by N commits)
Last updated: [DD-MM-YY HH:MM CET]
Last session: Day N — [brief description of what changed]

---

## Service / App Identity
Port: [XXXX]
Container name: [name]
Docker compose file: [path]
DB path: [path e.g. /app/data/workflows.db]
Last successful docker compose up --build: [DD-MM-YY HH:MM]

---

## Deployment State
Current running containers and status:
| Container | Status | Port | Last rebuilt |
|---|---|---|---|
| [name] | running/stopped | XXXX | DD-MM-YY |

.gitattributes merge=ours: ✅ in place / ❌ missing
.gitignore settings.local.json: ✅ in place / ❌ missing

---

## Environment Variables (.env)
Document critical env vars and their current state. Never store values here.
| Variable | Status | Notes |
|---|---|---|
| FP_OPENAI_API_KEY | ✅ set | Required for live LLM findings |
| FP_MOCK_MODE | false | Set to true to bypass OpenAI |
| FP_OPSWAT_API_KEY | ⚠ empty | MOCK_MODE used for scanning |

---

## API Endpoints
| Method | Path | Auth | Status |
|---|---|---|---|
| GET | /health | None | ✅ |
| GET | /vendors | Any role | ✅ |
| POST | /vendors | procurement_manager, admin | ✅ |
| DELETE | /vendors/{id} | policy_manager, admin | ✅ |
| PUT | /vendors/{id} | procurement_manager, admin | ✅ |

---

## Scenes / Components (flowpilot-ui only)
| File | Route | Status | Notes |
|---|---|---|---|
| LandingScene.jsx | / | ✅ | OPERATIONAL homepage |
| VendorFormScene.jsx | /vendor-form | ✅ | Redirects to /workflow-progress post-submit |
| VendorOverviewScene.jsx | /vendors | ✅ | New Day 10 |
| WorkflowProgressScene.jsx | /workflow-progress/:id | ✅ | View Vendor Registry button added |

---

## Database Schema
| Table | Last migration | Status | Notes |
|---|---|---|---|
| vendors | Day 10 | ✅ | Added vendor_type, access_level, data_classification, certifications, sub_processors, assessment_count, workflow_id |
| workflows | Day 5 | ✅ | — |
| audit_events | Day 1 | ✅ | — |

---

## Key Field Names (API contracts)
| Field | Correct name | Wrong name (historical) | Notes |
|---|---|---|---|
| Vendor name | name | vendor_name | Fixed Day 10 |
| Workflow ID | workflow_id | id | Added to VendorResponse Day 10 |

---

## Test Suite Status
| Suite | Count | Status | Last run |
|---|---|---|---|
| pytest unit | 164 | ✅ | Day 10 |
| pytest e2e | 50 | ✅ | Day 10 |
| Playwright | 10/12 pass, 2 skip | ⚠ 5 pre-existing failures | Day 10 |
| Demo scenario | 5/5 acts ✅ | passing | Day 10 |

---

## Known Issues / Tech Debt
- [ ] workflow_id unit tests missing (Day 10)
- [ ] 5 pre-existing Playwright failures (admin-upload, mobile-viewport)
- [ ] _coerce_access_level unit test missing
- [ ] headless: false in demo scenario — CI footgun

---

## Skills in .claude/skills/
- delivery-flow.md
- demo-scenario-protection.md
- env-and-container-ops.md
- python-syntax-safety.md
- secrets-management.md
- session-management.md
- code-review-protocol.md
- e2e-test-architecture.md
- coordinator-protocol.md
- team-code-review-assignments.md
- session-handover.md
