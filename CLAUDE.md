# flowpilot-docs

Part of the FlowPilot project (NSCS B.V.).

## Skills

Skills live in `.claude/skills/`. Consult them before doing related work.

- [test-strategy](.claude/skills/test-strategy.md) — Mock by default, integration opt-in. Tests must never cost money to run by default. Mark live API calls with `@pytest.mark.integration` and never run them in CI.
- [secrets-management](.claude/skills/secrets-management.md) — No hardcoded secrets; use env-var substitution and keep `.env` gitignored.
- [local-config-protection](.claude/skills/local-config-protection.md) — Don't commit `settings.local.json` or other personal config.
- [azure-key-vault](.claude/skills/azure-key-vault.md) — Protect critical config (KEYCLOAK_ISSUER, API keys); never change without explicit instruction. Azure Key Vault architecture for production.
