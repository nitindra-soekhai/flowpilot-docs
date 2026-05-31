# Env and Container Ops Skill
# Applied to ALL repos — no exceptions
# NSCS B.V. · Enterprise Quality Standard

## Core principle
.env changes and Docker container operations follow strict rules to prevent silent failures,
credential leaks, and hard-to-diagnose crash loops.

## .env file rules

### Never commit .env files
.env files contain real secrets (API keys, passwords, tokens) and are gitignored for security.
Never run git add .env or bypass the gitignore.

Use .env.example to document every required variable:
- List all variable names with placeholder or example values
- Add a one-line comment explaining each variable's purpose
- Keep .env.example committed and up to date whenever variables are added or removed

### MOCK_MODE=false requires a real API key
Setting MOCK_MODE=false switches the service from mock responses to live API calls.
If the corresponding API key is absent or empty, the service will fail at startup or first call.

Before setting MOCK_MODE=false:
1. Confirm the real API key is present in .env
2. Confirm the key is valid and has the required quota/permissions
3. Rebuild the container (see below)

## Docker container operations

### Changing any .env variable requires a full rebuild
docker compose up -d --build

A plain restart without --build reuses the cached image and environment — changes to .env
variables will NOT take effect. This is the most common source of "why isn't my change working?"

Rule: any time you touch .env, run:
docker compose up -d --build

### Verify container status after every rebuild
docker compose ps

Expected output: all containers show status Up or running (not Restarting).

### Restarting (1) means crash-loop — investigate immediately
If docker compose ps shows a container with status Restarting (1) or similar:
1. The container started, failed, and Docker restarted it — this will repeat indefinitely
2. Check logs immediately:

docker compose logs --tail=50

Or for a specific service:

docker compose logs <service-name> --tail=50

Common causes:
- Missing or invalid .env variable (especially after a .env change without --build)
- Python syntax error in a file included in the image
- Port conflict with another running container or process
- Database or dependency not yet ready (check depends_on and healthcheck config)

Do not ignore Restarting status — it will not resolve itself without intervention.

## Operational checklist

### After any .env change
- [ ] docker compose up -d --build (not just up -d)
- [ ] docker compose ps — confirm all containers are Up
- [ ] If any container is Restarting: docker compose logs --tail=50 for that service

### After any Python file change in a containerised service
- [ ] python -m py_compile <file> passes (see python-syntax-safety skill)
- [ ] docker compose up -d --build
- [ ] docker compose ps — confirm healthy status

### Before committing any .env-related change
- [ ] .env is in .gitignore — verify with git check-ignore -v .env
- [ ] .env.example is updated with any new or removed variable names
- [ ] No real secrets appear in .env.example (use placeholder values only)
