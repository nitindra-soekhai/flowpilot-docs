# Skill: Delivery Flow — FlowPilot Governed Development Process

## Purpose
Every piece of work that touches the FlowPilot codebase must follow this governed delivery flow before it is committed. No exceptions. This skill maps work to agents, defines review gates, and enforces CI/CD protection.

---

## The Flow

```
WORK
  ↓
BREAK-DOWN (Orchestration Coordinator)
  ↓
IMPLEMENTATION (Domain Agent)
  ↓
UNIT TESTS (Domain Agent) ← mandatory, written alongside code, all must pass
  ↓
CODE REVIEW — QA Agent
  ↓
CODE REVIEW — Security Agent
  ↓
EXPERT REVIEW — Domain Specialist (see matrix below)
  ↓
E2E PLAYWRIGHT TESTS — QA Agent
  ↓
CI/CD GATE — DevOps Agent
  ↓
COMMIT TO DEV
```

---

## Step 1 — Break-Down (Orchestration Coordinator)

Before any agent touches code, the coordinator must produce a mapping table:

| Brief | Section | Agent | Repo |
|-------|---------|-------|------|
| BRIEF-NAME.md | What this section covers | Agent name | repo name |

Nitindra approves the mapping. No work starts without approval.

---

## Step 2 — Implementation (Domain Agent)

| Work type | Agent |
|-----------|-------|
| RAG, retrieval, embeddings | Enterprise Retrieval agent |
| Vendor onboarding, workflow, HITL | Vendor Onboarding agent |
| React UI, scenes, UX | Frontend Experience agent |
| Messaging, integration | Middleware agent |
| Schema, migrations, SQLite | Database agent |
| CI/CD, Docker, pipelines | DevOps agent |
| Retrieval metrics, LLM ops | MLOps agent |
| Dashboards, telemetry | Analytics agent |
| Functional scope | Analyst agent |
| ADRs, C4, architecture | Architecture Knowledge agent |

One agent per brief. One repo per brief. Never combine.

### Unit tests are part of implementation — not optional

Every implementing agent must write unit tests alongside the code:
- New function → unit test
- New endpoint → unit test for success + failure + edge case
- New node/component → unit test for expected behaviour
- All existing unit tests must still pass after the change

Run before handing off to QA:
```bash
# Python
pytest tests/unit/ -v

# React
npm run test
```

Agent must confirm: **"Unit tests written and passing — X new, Y total"**

---

## Step 3 — Code Review: QA Agent

QA Agent reviews every implementation for:
- Test coverage (unit tests present and passing)
- Edge cases handled
- No hardcoded values
- No debug/print statements left in
- Code matches the brief scope — nothing more, nothing less

QA Agent must confirm: **"Code review passed"** before moving forward.

---

## Step 4 — Code Review: Security Agent

Security Agent reviews every implementation for:
- No secrets in plain text or logs
- No SQL injection risk
- RBAC enforcement on new endpoints
- JWT validation present where required
- Input validation on all user-facing inputs
- No sensitive data in error responses
- mask_secrets processor not bypassed

Security Agent must confirm: **"Security review passed"** before moving forward.

---

## Step 5 — Expert Review (Domain Specialist)

Based on what was changed, route to the relevant expert:

| Change type | Expert reviewer |
|-------------|----------------|
| UI components, scenes, UX patterns | Frontend Experience agent |
| API contracts, integration points | Middleware agent |
| Database schema, query changes | Database agent |
| Architecture decisions, ADR impact | Architecture Knowledge agent |
| Functional correctness, requirements | Analyst agent |
| LLM prompts, retrieval, token cost | MLOps agent |
| Deployment, Docker, infra impact | DevOps agent |
| Dashboards, metrics, telemetry | Analytics agent |

Expert must confirm: **"Expert review passed"** before moving forward.

---

## Step 6 — E2E Playwright Tests: QA Agent

QA Agent runs the full Playwright test suite:

```powershell
cd C:\Development\flowpilot\flowpilot-ui
npx playwright test
```

All existing tests must pass. If new functionality was added, new Playwright tests must cover it.

QA Agent must confirm: **"All E2E tests passing — X passed, 0 failed"**

---

## Step 7 — CI/CD Gate: DevOps Agent

Before commit, DevOps Agent confirms:
- New code does not break existing working flows
- Docker builds succeed in both repos
- No new environment variables added without .env.example update
- No breaking API contract changes without version bump
- Commit message follows convention: `type(scope): description`

CI/CD rule: **If any existing test fails after the change — do not commit. Fix first.**

---

## Commit Convention

```
type(scope): short description

Types: feat, fix, security, docs, chore, refactor, test
Scope: ui, rag, vendor-onboarding, infra, docs
```

---

## Anti-Patterns — Never Do These

- Never commit without QA code review
- Never commit without Security review
- Never skip E2E tests
- Never combine two agent domains in one brief
- Never push to main without Nitindra approval
- Never let a failing test block a review — fix it, then review
- Never commit code outside the brief scope

---

## Mapping Template (use for every brief)

```
DELIVERY FLOW MAPPING — [Brief Name]

| Brief | Section | Agent | Repo |
|-------|---------|-------|------|
| BRIEF-X.md | Implementation | [Agent] | [repo] |
| BRIEF-X.md | Code Review | QA Agent | [repo] |
| BRIEF-X.md | Security Review | Security Agent | [repo] |
| BRIEF-X.md | Expert Review | [Expert Agent] | [repo] |
| BRIEF-X.md | E2E Tests | QA Agent | flowpilot-ui |
| BRIEF-X.md | CI/CD Gate | DevOps Agent | all repos |

Awaiting Nitindra approval to proceed.
```
