# Skill: Session Management

## Purpose
Defines how Claude Code sessions are opened, used, and closed across the
FlowPilot polyrepo. Mismanaged sessions are the #1 cause of wrong briefs
in wrong repos and duplicate commits.

## Core Rule
**One repo = one Claude Code session.** Never run two agents in the same
repo simultaneously. Never paste a brief for repo A into a session open
in repo B.

## Session Lifecycle

### Opening a session
- Open Claude Code in the target repo directory
- Confirm the repo name is visible in the VS Code title bar before pasting anything
- Read CLAUDE.md before starting any work

### Identifying the correct session
Before pasting ANY brief or prompt, verify:
  1. VS Code title bar shows the correct repo name
  2. The terminal prompt shows the correct path
  3. The session is idle (no running command)

If uncertain: type `pwd` in the terminal and confirm the path.

### Stopping an agent mid-run
- **Esc** — stops the current agent task, keeps the session open
  Use when: agent is stuck, running the wrong thing, or taking too long
- **Ctrl+C** — kills the terminal process entirely
  Use when: Esc does not respond, or the session is frozen
- **Close session** — only after agent has printed COMPLETE and you are done
  Never close mid-run; always Esc first

### When to close a session
Close a session only when:
- The agent has printed its designated COMPLETE message
- The diff summary has been captured
- The commit has been pushed

Do NOT close a session because:
- The agent is waiting for input (answer it or Esc)
- You want to start a new brief (Esc the current task, paste new brief)
- The session printed a recap or suggestion (Esc the suggestion, session stays open)

## Brief Routing Rules

| Brief type | Target session |
|---|---|
| Builder brief | Fresh session in the target repo |
| Reviewer prompt | Fresh session in ANY repo (reviewer is stateless) |
| Patch brief | Same session as the original builder OR fresh session in same repo |
| Docs brief | Session in flowpilot-docs |

## Common Mistakes

| Mistake | Consequence | Prevention |
|---|---|---|
| Pasting builder brief into reviewer session | Reviewer executes code changes | Close reviewer session first; open fresh session |
| Pasting reviewer prompt into builder session | Builder runs review instead of building | Always open a fresh session for reviewer prompts |
| Two briefs active in same repo session | Race condition on git push | Esc first brief, confirm COMPLETE, then paste next |
| Pasting wrong repo's brief | Changes committed to wrong repo | Read title bar before pasting — every time |

## Parallel Sessions (allowed)
Two sessions MAY run simultaneously ONLY when:
- They are in different repos (e.g. flowpilot-ui AND flowpilot-vendor-onboarding)
- Their briefs touch zero shared files
- Both have been confirmed to start from the correct repo path

## Session State After COMPLETE
After an agent prints COMPLETE:
- Capture the diff summary and COMPLETE message
- The session remains open and usable
- Paste the reviewer prompt into a FRESH session (not this one)
- This session can be reused for a follow-up brief in the same repo
