# Secrets Management Skill
# Applied to ALL repos — no exceptions
# NSCS B.V. · Enterprise Security Standard

## The Rule
Secrets never enter git. Ever. Not even once. Not even in a private repo.

## What counts as a secret
- API keys (OpenAI, Anthropic, Voyage, AWS, Azure, Google)
- JWT secrets
- Database passwords
- Keycloak admin credentials
- Any value that starts with sk-, pk-, ey-, or similar
- Any .env file containing real values

## Before every commit — mandatory check
1. Run: git diff --cached | grep -iE "(api_key|secret|password|token|sk-|pk-)" 
2. If any match found: STOP — do not commit — alert Nitindra immediately
3. Verify .env is in .gitignore before staging any files
4. Verify .env.example exists and contains only placeholder values like: OPENAI_API_KEY=your-key-here

## .gitignore must always contain
.env
.env.local
.env.production
*.pem
*.key

## If a secret is accidentally committed
1. STOP all pushes immediately
2. Alert Nitindra
3. Rotate the key immediately — assume it is compromised
4. Remove from git history: git filter-branch or BFG Repo Cleaner
5. Force push to all branches
6. Never reuse the exposed key

## .env.example standard
Every repo must have .env.example with placeholder values only:
OPENAI_API_KEY=your-openai-api-key-here
FP_MOCK_MODE=false
JWT_SECRET=change-this-in-production

## DevOps agent rules
- Never read .env files and include values in commit messages
- Never log environment variable values
- Never echo secrets in shell commands
- Always verify .gitignore before git add -A

## This skill is non-negotiable
No task priority, deadline, or convenience justifies bypassing secrets management.
A leaked API key costs more to rotate and secure than any time saved.
