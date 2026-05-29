# Python Syntax Safety Skill
# Applied to ALL repos — no exceptions
# NSCS B.V. · Enterprise Quality Standard

## Core principle
Python syntax errors from invisible Unicode characters or non-ASCII quotes cause runtime failures
that are hard to diagnose. Always validate Python files before committing.

## Critical pitfalls — never do these

### 1. Curly/smart quotes in Python code
NEVER use curly (typographic) quote characters in Python source or docstrings:
- U+201C " LEFT DOUBLE QUOTATION MARK
- U+201D " RIGHT DOUBLE QUOTATION MARK
- U+2018 ' LEFT SINGLE QUOTATION MARK
- U+2019 ' RIGHT SINGLE QUOTATION MARK

Always use straight ASCII quotes:
- Double quote: "  (U+0022)
- Single quote: '  (U+0027)

These characters are visually identical in many editors but cause SyntaxError at parse time.
Common source: copy-pasting from Word, Notion, Slack, or AI-generated text in rich-text mode.

### 2. Unicode box-drawing characters in Python strings
NEVER embed Unicode box-drawing characters in Python strings or comments:
- ─ ━ │ ┃ ┄ ┅ ┆ ┇ ┈ ┉ ┊ ┋ ┌ ┍ ┎ ┏ ┐ ┑ ┒ ┓ └ ┗ ├ ┤ ┬ ┼ etc.
- ╔ ╗ ╚ ╝ ║ ═ ╠ ╣ ╦ ╩ ╬ etc.

Use plain ASCII alternatives instead:
- Horizontal lines: --- or ===
- Vertical separators: |
- Table corners: + (e.g., +---+---+)
- Bullet points: - or * or #

## Mandatory validation before committing Python files

### Syntax check command
Run after any edit to a Python file:
python -m py_compile <file>

For multiple files:
python -m py_compile app/main.py app/services/foo.py

For an entire package:
python -m compileall app/

A clean run produces no output. Any output means a syntax error — fix before proceeding.

### Agent edit rule
After any agent (Claude, Copilot, or automated script) edits Python files:
1. Run py_compile on every modified file
2. Fix any reported errors before staging the file
3. Only then run git add and git commit

Never commit a Python file that has not passed py_compile.

## Container rebuild after syntax fixes

Fixing a syntax error in a Python file that runs inside a Docker container requires a rebuild:

docker compose up -d --build

A plain `docker compose up -d` (no --build) reuses the old image and will still run the broken code.
Verify the container came up cleanly:

docker compose ps

Any container showing Restarting (1) status is crash-looping — check logs immediately:

docker compose logs --tail=50

## Checklist — before every Python commit
- [ ] No curly/smart quotes anywhere in the file (search: grep -P "[“”‘’]" <file>)
- [ ] No Unicode box-drawing characters in strings or comments
- [ ] python -m py_compile <file> exits with no output
- [ ] If file runs in a container: docker compose up -d --build executed and ps shows healthy status
