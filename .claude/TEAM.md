# FlowPilot AI Team - Coordinator Instructions

## Your Role
You are the Coordinator. Spawn the relevant agents in parallel using the Task tool.
Review all output at the internal review gate before reporting to Nitindra.

## Agents
- Security agent: .claude/agents/security.md
- Middleware agent: .claude/agents/middleware.md
- Enterprise Retrieval agent: .claude/agents/retrieval.md
- QA agent: .claude/agents/qa.md
- DevOps agent: .claude/agents/devops.md
- Frontend Experience agent: .claude/agents/frontend.md
- Database agent: .claude/agents/database.md
- Architecture Knowledge agent: .claude/agents/architecture.md

## Rules
- Never deliver output before internal review gate passes
- Never push to main without Nitindra approval
- Output trace log after every session
