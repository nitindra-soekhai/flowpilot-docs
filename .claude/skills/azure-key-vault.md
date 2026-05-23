# Azure Key Vault Skill
# Applied to ALL agents when handling secrets, credentials, or environment configuration
# NSCS B.V. · Enterprise Security Standard

## Core Principle
Secrets never live in files. They live in Azure Key Vault.
Every agent that touches configuration, environment variables, or credentials must read this skill first.

## The Problem This Solves
- docker-compose.yml with hardcoded secrets gets committed accidentally
- .env files get exposed in screenshots or logs
- Agents make decisions about KEYCLOAK_ISSUER or API keys without understanding why values are set
- Overnight agents revert deliberate security fixes thinking they are debugging artifacts

## Current State (Local Development)
Until Azure deployment is complete, secrets are stored in .env files:
- flowpilot-rag-service/.env — FP_OPENAI_API_KEY, FP_MOCK_MODE
- flowpilot-vendor-onboarding/.env — FP_MOCK_MODE, JWT_SECRET, KEYCLOAK config

Rules for local dev:
- .env files are NEVER committed (enforced by .gitignore)
- docker-compose.yml uses ${VAR:-default} substitution only
- No agent may read .env values and include them in commit messages, logs, or output
- No agent may change KEYCLOAK_ISSUER, FP_OPENAI_API_KEY, or JWT_SECRET without explicit instruction from Nitindra

## Production State (Azure Deployment)
All secrets will be stored in Azure Key Vault and referenced via:
- Azure Container Apps secret references
- Managed Identity (no credentials needed in code)
- Key Vault references in docker-compose for local dev simulation

## Critical Config Values — DO NOT CHANGE WITHOUT EXPLICIT INSTRUCTION

### KEYCLOAK_ISSUER
Current value: http://localhost:8080/realms/flowpilot
Why: Keycloak issues JWT tokens with localhost:8080 as the issuer claim.
The backend MUST match this exactly or JWT validation fails with "invalid_token".
This is a deliberate fix for issue I-09. It is NOT a debugging artifact.
Never revert this to http://keycloak:8080 — that breaks JWT validation.

### FP_OPENAI_API_KEY
Stored in .env only. Never in docker-compose.yml.
Referenced as ${FP_OPENAI_API_KEY:-} in docker-compose.
Azure production: referenced from Key Vault secret flowpilot-openai-api-key.

### JWT_SECRET
Stored in .env only. Default placeholder in docker-compose is for dev only.
Azure production: referenced from Key Vault secret flowpilot-jwt-secret.

### FP_MOCK_MODE
false in production and local live mode.
true only in unit tests and CI.
Never change this without explicit instruction.

## Azure Key Vault — Production Architecture

### Vault Structure
Vault name: flowpilot-kv (to be created during Azure deployment)
Resource group: flowpilot-rg

Secrets:
- flowpilot-openai-api-key → OPENAI API key
- flowpilot-jwt-secret → JWT signing secret
- flowpilot-keycloak-admin-password → Keycloak admin password
- flowpilot-db-connection-string → SQLite path or future DB connection

### Access Pattern
- Local dev: .env file (gitignored)
- Azure Container Apps: Key Vault reference via Managed Identity
- CI/CD: GitHub Actions secrets (never Key Vault directly)

### Code Pattern (when implemented)
# Never hardcode. Always use environment variables.
import os
SECRET = os.getenv("MY_SECRET")
if not SECRET:
    raise RuntimeError("MY_SECRET not set — check .env or Key Vault reference")

## Agent Rules

### Before touching ANY environment variable or config value:
1. Read this skill
2. Check if the value is in the Critical Config Values section above
3. If yes — DO NOT CHANGE IT without explicit instruction from Nitindra
4. If unsure — ask before changing

### Before committing docker-compose.yml:
1. Scan for any hardcoded secrets: grep -E "(sk-|password|secret|api_key)" docker-compose.yml
2. If found — do not commit, alert Nitindra
3. Verify all secrets use ${VAR:-default} pattern
4. Verify KEYCLOAK_ISSUER is http://localhost:8080/realms/flowpilot

### Never:
- Change KEYCLOAK_ISSUER without explicit instruction
- Read .env file contents into logs, commit messages, or output
- Assume a config value is a "debugging artifact" — ask first
- Commit docker-compose.yml with hardcoded secrets
