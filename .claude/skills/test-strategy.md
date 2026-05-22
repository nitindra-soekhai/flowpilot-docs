# Test Strategy Skill
# Applied to ALL repos — no exceptions
# NSCS B.V. · Enterprise Quality Standard

## Core principle
Tests must never cost money to run by default.
Mock external API calls (OpenAI, Keycloak, Qdrant) in all default test runs.
Real integration tests are opt-in only.

## Test pyramid for FlowPilot

### Layer 1 — Unit tests (always run, zero cost)
- Mock all external dependencies
- Test business logic, transformations, validations
- Run on every git push via CI
- Target: < 5 seconds total runtime

### Layer 2 — Mock integration tests (always run, zero cost)
- Mock OpenAI embedding and LLM calls with unittest.mock
- Real FastAPI routes, real Qdrant (local), real Keycloak (local)
- Test auth, RBAC, pipeline structure, response schema
- Run on every git push via CI
- Marked: default (no marker needed)

### Layer 3 — Live integration tests (opt-in, costs money)
- Real OpenAI calls
- Real Keycloak JWT validation
- Real Qdrant vector operations
- Marked: @pytest.mark.integration
- Run manually: pytest -m integration
- Run on release only — never in CI by default
- Estimated cost: ~$0.004 per full run

### Layer 4 — E2E tests (opt-in, Playwright)
- Full browser flow: login → vendor form → approval → audit trail
- Marked: @pytest.mark.e2e
- Run manually or on release: pytest -m e2e
- Video recording for demo purposes

## Mock patterns — use these consistently

### Mock OpenAI embeddings
from unittest.mock import patch, MagicMock
with patch("app.services.embedding_service.OpenAIEmbeddings") as mock:
    mock.return_value.embed_documents.return_value = [[0.1] * 1536]
    mock.return_value.embed_query.return_value = [0.1] * 1536

### Mock GPT-4o grounding
with patch("app.services.grounding_pipeline.ChatOpenAI") as mock:
    mock.return_value.invoke.return_value = MagicMock(content="Mocked policy response")

### Mock Keycloak token (unit tests only)
with patch("app.middleware.rbac.verify_token") as mock:
    mock.return_value = {"sub": "test-user", "preferred_username": "sarah.chen", "realm_access": {"roles": ["procurement_manager"]}}

## Rules
- Never commit a test that makes real OpenAI calls without @pytest.mark.integration
- Never run integration tests in CI/CD pipelines
- Always verify mock tests pass before running integration tests
- Cost per integration test run must be documented in the test docstring
- QA agent must report: tests written · mock vs integration · estimated cost per run

## CI configuration
pytest.ini or pyproject.toml must include:
[pytest]
markers =
    integration: marks tests that make real API calls (costs money)
    e2e: marks end-to-end Playwright tests

addopts = -m "not integration and not e2e"

This ensures integration and e2e tests are NEVER run accidentally in CI.
