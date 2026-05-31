# Skill: Team Code Review Assignments

## Purpose
Maps every type of code change to the correct reviewer agent(s).
Eliminates the "who reviews what" question at every review gate.

## Assignment Table

| Change type | Primary reviewer | Secondary reviewer | Notes |
|---|---|---|---|
| Backend API endpoint | Vendor Onboarding | Security | Security checks RBAC + auth |
| RBAC / auth / JWT change | Security | Vendor Onboarding | Security always primary for auth |
| Secrets / credentials handling | Security | QA | QA checks masking tests |
| Keycloak realm configuration | Security | Infrastructure | Realm changes affect all auth flows |
| Frontend component (new or modified) | Frontend Experience | QA | QA checks E2E coverage |
| React scene routing change | Frontend Experience | Arch. Knowledge | Arch. Knowledge checks ADR impact |
| Playwright E2E test | QA | Frontend Experience | QA primary — owns test architecture |
| pytest unit test | QA | (single reviewer) | — |
| SQLite schema migration | Database | Vendor Onboarding | Database checks migration safety |
| Pydantic model / validator | Vendor Onboarding | QA | QA checks validator unit tests exist |
| Docker compose / container config | Infrastructure | DevOps | DevOps checks port + network conventions |
| LangGraph workflow / nodes | MLOps | Vendor Onboarding | MLOps checks AI pipeline correctness |
| RAG pipeline / retrieval | Enterprise Retrieval | QA | QA checks retrieval metric tests |
| OpenAI / LLM integration | MLOps | Security | Security checks prompt injection mitigations |
| OpenAPI contract change | Middleware | Frontend Experience | Frontend checks UI impact |
| Skills / CLAUDE.md update | Arch. Knowledge | QA | QA checks skill is actionable |
| Skills sync to repos | Arch. Knowledge | DevOps | DevOps checks sync is complete across all repos |
| ADR document | Arch. Knowledge | Analyst | Analyst checks metrics impact |
| Git / branching / release ops | DevOps | (single reviewer) | — |
| Analytics widget / session report | Analytics | Analyst | — |
| Infrastructure bootstrap script | Infrastructure | DevOps | — |

## How to Use This Table
1. Identify change type(s) from the diff
2. Look up primary + secondary reviewer
3. Multiple change types → combine into one prompt, use primary of most critical change
4. Paste reviewer prompt to the assigned agent session

## Multi-Domain Changes
When diff touches multiple domains:
- Combine into ONE reviewer prompt (faster, avoids conflicting findings)
- Exception: diff >200 lines across >5 files → split by domain, run parallel

## Reviewer Session Setup
- Open in ANY repo (reviewers are stateless)
- Follow code-review-protocol.md prompt format
- Return APPROVED or BLOCKED — nothing else
- Close session after verdict

## Escalation
BLOCK requiring design decision → escalate to Arch. Knowledge before patch brief.
Arch. Knowledge confirms design, then coordinator writes patch brief.
