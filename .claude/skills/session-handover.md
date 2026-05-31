# Skill: Session Handover

## Purpose
Defines how every session ends and how the next session starts.
A clean handover is the single most effective way to reduce junction
overhead, coordinator memory drift, and misalignment incidents.
Every session produces a handover artifact. Every session consumes one.

---

## Why This Exists
As the codebase grows, the coordinator's mental model of current state
diverges from reality. Without a handover artifact, every new session
starts from memory — which degrades. The handover artifact is the
antidote: a written snapshot of truth that replaces memory.

Handover junctions cost ~3h per session in relay overhead (Day 10 data).
A well-structured handover reduces this to ~30 min.

---

## End-of-Session Checklist (mandatory before closing)

### 1. Commit and tag
- All repos merged to main
- Version tagged across all 5 repos
- GitHub releases created if applicable

### 2. Update STATE.md in every repo that changed
For each repo that had commits this session:
- Update version, branch, last-updated
- Update deployment state (containers, last rebuild)
- Update API endpoints if any were added/changed
- Update scenes/components if any were added/changed
- Update key field names if any changed
- Update test suite counts and status
- Update known issues / tech debt (add new WARNs, close fixed items)
- Update last session summary (2-3 sentences max)

Commit STATE.md separately with:
```
git commit -m "chore: update STATE.md for Day N session"
```

### 3. Update living documents if needed
- FRS: update if new features shipped or product decisions made
- Architecture Requirements: update if new ADRs added
- Day N+1 brief: create or update if planning ahead

### 4. Write the handover note (see format below)

### 5. Update session analytics
- Record session totals, bugs, rework ratio, FTR
- Record handover junction metrics
- Update cumulative analytics table

---

## Handover Note Format

At the end of every session, produce this note for the next session:

```
## Day N Handover → Day N+1

### Version shipped
v[X.Y-tag-name] — [one line description]

### What was completed today
- [feature/fix 1]
- [feature/fix 2]

### What is NOT done (carry forward)
- [item 1] — reason
- [item 2] — reason

### Known state issues
- [any broken thing, known bug, or unstable service]
- [any stale container that needs rebuild]

### First action for Day N+1
[Exact first step: e.g. "Run start-flowpilot.ps1 and verify health"]

### Open tech debt logged today
- [WARN from code review 1]
- [WARN from code review 2]
```

---

## Start-of-Session Checklist (mandatory before writing any brief)

### 1. Read the knowledge framework
In this order:
1. STATE.md for each repo you will touch today
2. FRS (current version)
3. Architecture Requirements (current version)
4. Day N brief (if provided by Nitindra)
5. Previous session handover note

Reading time: ~10 min. Skipping this causes ~2h of misalignment later.

### 2. Present the master checklist
Extract from Day N brief and present as a table with:
- Phase number
- Item description
- Repos affected
- Status (⬜ / ✅ / ⏳)

### 3. State current version and what was last completed
"We are at v[X.Y]. Last session completed [X]. Today we start with [Y]."

### 4. Confirm governed flow for the day
State which steps require YOU ✋ approval before proceeding.

### 5. Run bootstrap verification
```powershell
curl.exe http://localhost:8001/health
curl.exe http://localhost:8000/health
curl.exe http://localhost:8080/realms/flowpilot
```

---

## Handover at Context Limit

When the coordinator context window is nearly full (Claude will indicate
this or responses become less coherent):

1. Produce a handover note immediately — do not wait for session end
2. Include: exact current task state, next step, any open decisions
3. Start a fresh conversation and feed in:
   - The handover note
   - FRS + Architecture Requirements docs
   - STATE.md for relevant repos
   - Day N brief

This is not a failure — it is the normal operating pattern for long sessions.

---

## Handover Junction Metrics (tracked every session)

| Metric | Definition |
|---|---|
| total_junctions | Count of all handovers (coord→you, you→builder, builder→you, you→reviewer, reviewer→you) |
| junction_mismatches | Wrong content pasted at a junction (wrong brief, wrong session, old diff) |
| relay_minutes | Estimated total time spent in copy-paste relay |
| approval_gates | Number of YOU ✋ steps triggered |
| avg_min_per_junction | relay_minutes / total_junctions |

### Day 11 targets
- total_junctions < 40
- junction_mismatches = 0
- relay_minutes < 90

### How to reduce junctions
1. Batch briefs — one brief per agent covers all same-day work for that repo
2. Reviewer prompt travels with the diff — builder COMPLETE message includes the reviewer prompt
3. STATE.md read at session start — eliminates brief-writing relay cycles caused by stale knowledge
4. WARN=tech debt — eliminates patch→review→patch loops
5. Session handover note — eliminates "what were we doing?" relay at session start
