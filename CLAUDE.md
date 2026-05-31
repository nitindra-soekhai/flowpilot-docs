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
- [demo-scenario-protection](.claude/skills/demo-scenario-protection.md) — 4-act UI quality gate: every UI change must replay the full Playwright demo scenario before commit. Covers all 4 acts (create, approve, delete, re-assess) with exact selector, badge text, and RBAC checks.
