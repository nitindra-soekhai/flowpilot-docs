# Skill: New Keycloak Role Checklist
# Applied to ALL repos — no exceptions
# NSCS B.V. · Identity & Access Standard

## Purpose
Every time a new Keycloak role or demo user is added to FlowPilot, all steps in this checklist must be completed. Missing any step caused a broken demo environment on Day 9 — this checklist prevents that from happening again.

---

## Checklist: adding a new Keycloak role

Complete every step in order. Do not skip any.

### Step 1 — keycloak/flowpilot-realm.json (flowpilot-rag-service)

- Add a role object to the `roles.realm` array
- Follow the existing pattern exactly
- Validate JSON is well-formed after editing (no trailing commas, matching braces)

```json
{
  "name": "new_role_name",
  "description": "Human-readable description of what this role can do"
}
```

### Step 2 — setup-keycloak-users.ps1 (flowpilot-rag-service)

- Add a `New-KeycloakUser` block for each demo user assigned this role
- Add an `Assign-RealmRole` block immediately after each user creation
- Follow the existing sarah.chen / michael.davidson pattern exactly — do not invent a new pattern

```powershell
# Example — replace with actual user values
New-KeycloakUser -Username "firstname.lastname" `
                 -Email "firstname.lastname@flowpilot.local" `
                 -Password "FlowPilot2026!" `
                 -FirstName "Firstname" `
                 -LastName "Lastname"

Assign-RealmRole -Username "firstname.lastname" -Role "new_role_name"
```

### Step 3 — app/middleware/rbac.py (affected service repo)

- Add the role name string to the `VALID_ROLES` list
- Add an entry to `ROLE_PERMISSIONS` dict with the correct permission set
- Verify that the role cannot access endpoints or data above its intended level — check against every existing role

```python
VALID_ROLES = [
    "procurement_manager",
    "security_approver",
    "policy_manager",
    "new_role_name",   # add here
]

ROLE_PERMISSIONS = {
    ...
    "new_role_name": {"read:vendors", "submit:requests"},  # adjust to actual scope
}
```

### Step 4 — UI role gate (flowpilot-ui)

- Add the role to `allowedRoles` on every `RoleGate` component that wraps a scene this role may access
- Add the navigation link visibility condition in the sidebar/nav component
- Verify the role cannot see scenes above its permission level — check every gated scene

### Step 5 — Unit tests (affected repo)

Write and pass all three of these tests before handing off to QA:

| Test name | What it verifies |
|-----------|-----------------|
| `test_{role}_token_accepted_by_middleware` | A valid JWT with this role passes RBAC middleware |
| `test_{role}_cannot_exceed_permissions` | Returns 403 on every endpoint above this role's level |
| `test_{role}_role_extracted_from_jwt_correctly` | Role claim is parsed correctly from the JWT payload |

### Step 6 — SESSION-HANDOFF.md (affected repo)

- Add a row to the users table with: username · role · password
- Add a note describing what the role can and cannot access

### Step 7 — DAY-CONTEXT-BRIEF.md (next session context file)

- Update the users/credentials table to include the new user
- Add a note to the architecture summary describing the new role and its scope

---

## Demo user naming convention

| Field | Format |
|-------|--------|
| Username | `firstname.lastname` — lowercase, no accents, no spaces |
| Email | `firstname.lastname@flowpilot.local` |
| Password | `FlowPilot2026!` — all demo users, no exceptions |
| Name style | Dutch or international names — consistent with existing users |

---

## Current demo users

Keep this table updated every time a user is added.

| Username | Role | Password |
|----------|------|----------|
| sarah.chen | procurement_manager | FlowPilot2026! |
| michael.davidson | security_approver | FlowPilot2026! |
| lisa.vandenberg | policy_manager | FlowPilot2026! |

---

## Anti-patterns — never do these

- Never add a role to realm.json without updating setup-keycloak-users.ps1
- Never add a user to the setup script without also adding the role assignment block
- Never leave ROLE_PERMISSIONS empty for a new role — even read-only roles need an explicit entry
- Never use a password other than `FlowPilot2026!` for demo users
- Never create a username with capital letters, accents, or spaces
