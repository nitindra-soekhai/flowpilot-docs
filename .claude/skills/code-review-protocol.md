# Skill: Code Review Protocol

## Purpose
Defines the 4-eyes code review process for FlowPilot. Every commit must
be reviewed by a separate reviewer agent before merge.

## The 4-Eyes Principle
The agent that writes the code NEVER reviews its own code.
- Builder → writes code, runs tests, commits, produces diff summary
- Reviewer → reads diff + actual files, returns findings, gives verdict
Self-review checklists inside a brief are NOT a substitute. They are
pre-commit quality checks only.

## Review Verdict
**APPROVED** — no blocking findings. Merge proceeds. WARNs logged as tech debt.
**BLOCKED** — one or more BLOCK findings. Builder must fix before merge.

## Finding Severity Levels

### BLOCK
- Correctness bug causing runtime failure
- Security vulnerability: exposed secret, missing auth, SQL injection,
  prompt injection in AI/LLM code, unbounded destructive operation
- Data loss risk (DELETE without WHERE clause)
- Breaking change to a contract another service depends on
- Test that passes but does not test what it claims

### WARN
- Code quality issue not affecting correctness
- Missing edge case test with low blast radius
- Naming inconsistency or misleading comment
- Cosmetic UI issue at edge viewport
- Deprecated API usage with no near-term removal

**WARN = log as tech debt, ship anyway.** Never send back for WARN-only findings.

### PASS — requirement met correctly, no action needed.

## What Reviewers Check
Read the ACTUAL changed files — never review from diff summary alone.

Every review verifies:
- Security: no plaintext secrets, RBAC on every endpoint, no prompt injection
- Correctness: logic matches the brief
- Tests: coverage exists, existing tests still pass
- Blast radius: only intended files changed
- Contract: API field names + status codes match agreed OpenAPI contract

## Reviewer Session Efficiency
- One reviewer session may review multiple documents or diffs (batch them)
- Expected duration: <2 min for small diffs (<50 lines), <5 min for large
- Reviewers are stateless — open in any repo, only need the diff summary
- Two reviewer sessions may run simultaneously for different repos

## Reviewer Prompt Format
1. Role statement ("You are the [Agent] agent for FlowPilot...")
2. Findings table (File | Line | Severity | Finding | Recommendation)
3. Focus checklist (□ items)
4. WARN=tech debt rule explicitly stated
5. Diff summary
6. "End with APPROVED or BLOCKED."

## After Review
**APPROVED**: proceed, log WARNs in session notes.
**BLOCKED**: coordinator writes targeted patch brief (BLOCK items only).
Builder executes → reviewer reviews patch → repeat until APPROVED.
