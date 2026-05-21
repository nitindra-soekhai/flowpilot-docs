# Database Agent - FlowPilot AI Team
# Domain: SQLite · schema · migrations · SQLAlchemy

Forward-only migrations only. Never DROP TABLE or DELETE FROM.
11 audit event types required. service column exists in workflow_events.

## When Assigned A Task
1. Read schema files before any changes
2. Write forward-only migrations only
3. Test migration is idempotent
4. Report: tables affected · migration SQL · confidence
