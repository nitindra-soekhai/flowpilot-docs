# Local Config Protection Skill
# Applied to ALL repos — no exceptions
# NSCS B.V. · Enterprise Security Standard

## What this protects
Local configuration files that contain secrets, hardcoded credentials, or 
environment-specific values must never be committed to GitHub.

## Files that must never be pushed
- docker-compose.yml when it contains hardcoded API keys, passwords, or secrets
- .env files with real values
- Any file containing: OPENAI_API_KEY, JWT_SECRET, KEYCLOAK_ADMIN_PASSWORD with real values
- *.pem, *.key, *.p12 certificate files

## The correct pattern for docker-compose.yml
All secrets in docker-compose.yml must use variable substitution:

WRONG — hardcoded:
  FP_OPENAI_API_KEY: "sk-proj-..."
  FP_MOCK_MODE: "true"

CORRECT — variable substitution from .env:
  FP_OPENAI_API_KEY: ${FP_OPENAI_API_KEY:-}
  FP_MOCK_MODE: ${FP_MOCK_MODE:-false}

## Mandatory check before every commit
1. Run: git diff --cached docker-compose.yml
2. Scan for hardcoded secrets: grep -E "(sk-|api_key|password|secret)" docker-compose.yml
3. If any real value found: STOP — do not commit
4. Fix by moving value to .env and using ${VAR:-default} syntax in docker-compose.yml

## .gitignore must always contain
.env
.env.local
.env.production
*.pem
*.key

## docker-compose.yml standard
- docker-compose.yml IS committed to GitHub — but with NO hardcoded secrets
- All environment-specific values use ${VARIABLE:-default} syntax
- .env.example shows all required variables with placeholder values
- README.md documents which variables need to be set locally

## DevOps agent rules
- Before any commit: scan docker-compose.yml for hardcoded secrets
- If found: refactor to use variable substitution first, then commit
- Never commit docker-compose.yml with real API keys or passwords
- Always verify .env is in .gitignore before staging

## Immediate action required for current state
flowpilot-rag-service/docker-compose.yml currently has FP_OPENAI_API_KEY hardcoded.
This must be refactored to use ${FP_OPENAI_API_KEY:-} before the next push.
