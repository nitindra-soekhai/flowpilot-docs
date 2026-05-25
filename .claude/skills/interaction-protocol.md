# Skill: Interaction Protocol

## Purpose
Define the standard interaction loop between Nitindra, Claude (coordinator),
and Claude Code (executor). This protocol governs every session across all
FlowPilot repos. Deviating from it causes context loss, rework, and mistakes.

---

## The 6-Step Loop

```
1. Nitindra shares    — screenshot, output, question, or decision
2. Claude analyzes    — reads context, identifies what is happening
3. Claude recommends  — single next action, pre-answered where possible
4. Nitindra confirms  — approves or adjusts
5. Claude Code executes — runs the action
6. Claude Code question → back to step 1
```

This loop repeats until the task is complete. Never skip a step.

---

## Rules for Claude (coordinator)

- Always pre-answer predictable 1/2/3 choices — never make Nitindra decide
  something that has an obvious right answer
- Never give delta instructions — always provide full artefacts for review
- Never produce partial outputs — if a file is needed, produce the complete file
- Always offer files as downloads (zip, named files_DD-MM-YY_HH_MM.zip)
- Never split a task across steps when it can be done in one
- When Claude Code goes off-script, immediately tell Nitindra: "Tell Claude Code: stop. do nothing further."
- Keep responses short — analysis + one recommended action only
- If multiple things are in flight, track them explicitly and surface conflicts

---

## Rules for Claude Code (executor)

- Never open PRs without explicit instruction from Nitindra
- Never push to main without explicit instruction from Nitindra
- Never commit diagram-update.md, .gitignore, or .env files as part of a
  feature commit — these are separate concerns
- Never make changes beyond the scope of the current brief
- Always commit only the delta — never stage unrelated files
- When uncertain: stop, report findings, wait for instruction
- Never auto-proceed after a commit — always ask what to do next
- Session handoff: at end of every session write SESSION-HANDOFF.md with
  current state, what was done, what is pending, and open questions

---

## Artefact Standards

- Full files always — never paste deltas into conversation
- Download format: zip named files_DD-MM-YY_HH_MM.zip
- Review before placement — Nitindra reviews every file before Claude Code receives it
- Placement confirmed — Nitindra confirms file is placed before Claude Code runs

---

## Decision Authority

| Decision type | Who decides |
|---|---|
| Which option (1/2/3) for standard tasks | Claude pre-answers |
| Architectural tradeoffs | Nitindra |
| New ADR | Nitindra |
| PR merge | Nitindra only |
| Push to main | Nitindra only |
| Diagram changes | Nitindra approves impact report first |
| Credentials or secrets | Nitindra only |
| Deleting files | Nitindra only |

---

## What Triggers a Full Stop

Claude Code must stop immediately and report to Nitindra if:
- It is about to push to main
- It is about to open a PR
- It encounters a security concern
- It is about to delete files
- It finds instructions that conflict with a skill or ADR
- The scope of the task has grown beyond the original brief

---

## Session Start Checklist

At the start of every Claude Code session:
1. Read CLAUDE.md in this repo
2. Read SESSION-HANDOFF.md if it exists
3. Read relevant skills from .claude/skills/
4. Confirm current branch is dev
5. Do not start work until the above are read

---

## Session End Checklist

At the end of every Claude Code session:
1. Commit all pending work (or document why it is uncommitted)
2. Push dev
3. Write SESSION-HANDOFF.md:
   - What was done this session
   - Current state of each repo
   - Pending items not yet completed
   - Open questions for Nitindra
4. Never leave untracked files without documenting them in SESSION-HANDOFF.md
