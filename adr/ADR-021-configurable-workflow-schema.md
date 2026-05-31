# ADR-021 — Configurable workflow schema via SQLite config store

**Status:** 🟡 Accepted — implementation Day 11

**Layer:** 🟡 Boundary
> Applies to flowpilot-vendor-onboarding, flowpilot-ui, flowpilot-docs.
> The configurable schema capability makes FlowPilot a reusable platform for any onboarding or intake workflow — not just vendor onboarding.

**Deciders:** Nitindra Soekhai (NSCS B.V.)

**Extends:** ADR-018 (demo-to-production adapter pattern), ADR-010 (RBAC — admin role governs config access)

---

## Context

FlowPilot is designed as a reusable platform demonstrated through the vendor onboarding domain (ADR-008). As the platform matures, the question emerges: does "a different domain" require a code deployment, or can the platform be reconfigured at runtime?

Three aspects of the intake workflow are currently hardcoded:

1. **Intake form fields** — vendor_name, vendor_type, business_justification, requested_access_level
2. **Entity label** — "vendor" appears throughout the UI and API responses
3. **AI findings prompt** — the security review prompt is written for vendor risk assessment

If a second workflow type (HR onboarding, IT provisioning) reuses FlowPilot, these three aspects must change without a code deployment. Hardcoding them to vendor onboarding contradicts the platform positioning.

---

## Decision

**The Admin module configures intake form fields, entity label, and AI findings prompt at runtime via a SQLite `workflow_config` table. Vendor onboarding is the default seed configuration. New workflow types are added by inserting a config row — no code deployment required.**

```
workflow_config
  ├── workflow_type       TEXT PK       (e.g. "vendor_onboarding", "hr_onboarding")
  ├── entity_label        TEXT          (e.g. "vendor", "candidate")
  ├── intake_form_schema  TEXT (JSON)   (field definitions: name, type, required, label)
  ├── findings_prompt     TEXT          (AI security/assessment prompt template)
  ├── created_at          TEXT
  └── updated_at          TEXT
```

**Default seed (vendor onboarding):**
- `entity_label`: "vendor"
- `intake_form_schema`: current vendor intake fields (vendor_name, vendor_type, business_justification, requested_access_level, documents)
- `findings_prompt`: current vendor security assessment prompt

**Access control:** Only users with the `admin` role may read or write `workflow_config` entries. Configuration changes are written to the audit log (ADR-010).

**UI:** The React intake form renders fields from `intake_form_schema` dynamically. Entity labels throughout the UI are substituted from `entity_label`. No UI code change is required to support a new workflow type.

---

## Alternatives Considered

**Config file (YAML / JSON at deploy time)**
Environment-specific config files. Requires a deployment for any config change. Rejected: adds deployment overhead for what is fundamentally a data change. Contradicts the platform positioning.

**Hardcode vendor onboarding permanently**
Fast, no complexity. Rejected: limits FlowPilot to a single-domain portfolio piece rather than a reusable platform. The platform positioning (ADR-008) requires that a second domain be demonstrably addable.

**External config service (Consul, AWS AppConfig)**
Production-grade, hot-reloadable config. Rejected at portfolio scope: introduces an additional infrastructure dependency beyond the demo-to-production adapter pattern already established in ADR-018. SQLite config store is fully consistent with the ADR-018 adapter contract and requires no new services.

---

## Accepted Tradeoff

The SQLite config store is single-instance. Multi-tenant, multi-instance deployments require a shared config database or a config service. This is the same tradeoff documented for all SQLite usage in FlowPilot (ADR-005). The production upgrade path is identical: replace the SQLite adapter with a PostgreSQL or config-service adapter — no domain code changes required (ADR-018).

Config schema changes (adding a new field to `intake_form_schema`) are additive. Existing workflow records that predate the new field may have incomplete data — this is a migration concern, not a platform design concern, and is handled by the standard ALTER TABLE migration pattern.

---

## Consequences

- A second workflow type (HR onboarding, IT provisioning) can be added by an admin user at runtime — no code deployment
- `flowpilot-ui` intake form becomes schema-driven; all field-specific rendering logic is removed from the codebase
- `flowpilot-vendor-onboarding` findings generator accepts a prompt template parameter from config — no hardcoded vendor domain references remain in the prompt
- `flowpilot-docs` documents the config schema as the intake contract for new workflow types
- The platform is demonstrably reusable — vendor onboarding is one configuration, not one product

---

*FlowPilot · NSCS B.V. · ADR-021 · May 2026*
