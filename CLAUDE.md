# flowpilot-docs

Part of the FlowPilot project (NSCS B.V.).

## Skills

Skills live in `.claude/skills/`. Consult them before doing related work.

- [test-strategy](.claude/skills/test-strategy.md) — Mock by default, integration opt-in. Tests must never cost money to run by default. Mark live API calls with `@pytest.mark.integration` and never run them in CI.
- [secrets-management](.claude/skills/secrets-management.md) — No hardcoded secrets; use env-var substitution and keep `.env` gitignored.
- [local-config-protection](.claude/skills/local-config-protection.md) — Don't commit `settings.local.json` or other personal config.
- [azure-key-vault](.claude/skills/azure-key-vault.md) — Protect critical config (KEYCLOAK_ISSUER, API keys); never change without explicit instruction. Azure Key Vault architecture for production.
- [new-role-checklist](.claude/skills/new-role-checklist.md) — Complete checklist for adding a Keycloak role or demo user. Must touch realm.json, setup script, rbac.py, UI gate, tests, and handoff docs.
- [go-live-production](.claude/skills/go-live-production.md) — Full demo-to-Azure production transition guide: adapter swaps, identity migration, infra checklist, security hardening, smoke tests, rollback plan.
- [python-syntax-safety](.claude/skills/python-syntax-safety.md) — Never use curly quotes or Unicode box-drawing in Python; always run `python -m py_compile` before committing; rebuild containers after syntax fixes.
- [env-and-container-ops](.claude/skills/env-and-container-ops.md) — `.env` changes require `docker compose up -d --build`; MOCK_MODE=false needs a real key; verify container status after rebuild; never commit `.env`.
- [demo-scenario-protection](.claude/skills/demo-scenario-protection.md) — 5-act self-contained UI quality gate. beforeAll creates data, all 5 acts run, afterAll deletes everything. Impact assessment checklist mandatory before every implementation.
- [session-handover](.claude/skills/session-handover.md) — Read at START and END of every session. Update STATE.md at end; read STATE.md + FRS + Arch Req at start.
- [session-management](.claude/skills/session-management.md) — One repo = one session. Brief routing, Esc vs Ctrl+C, parallel session rules.
- [code-review-protocol](.claude/skills/code-review-protocol.md) — 4-eyes review, BLOCK/WARN/PASS criteria, reviewer prompt format.
- [e2e-test-architecture](.claude/skills/e2e-test-architecture.md) — Self-contained tests, SQLite seed pattern, selector rules.
- [coordinator-protocol](.claude/skills/coordinator-protocol.md) — Governed delivery flow, team role names, session start protocol.
- [team-code-review-assignments](.claude/skills/team-code-review-assignments.md) — Maps every change type to primary + secondary reviewer.
- [STATE-template](.claude/skills/STATE-template.md) — Template for STATE.md. Use to create/update at end of every session.
- [TEAM](.claude/skills/TEAM.md) — Full team structure, roles, responsibilities, governing rules.
