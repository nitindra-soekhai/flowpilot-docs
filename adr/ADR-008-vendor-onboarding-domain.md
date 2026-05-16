# ADR-008 — Vendor Onboarding as Demonstration Domain

**Status:** Accepted — May 2026  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The portfolio requires a realistic domain to demonstrate enterprise AI platform design to peer architects and hiring managers. Domain choice directly affects portfolio credibility: a trivial domain (to-do lists, weather queries) signals that the architect has not worked on real enterprise problems.

---

## Decision

**Vendor onboarding.** It requires multi-department coordination, approval orchestration, policy retrieval, document validation, exception handling, compliance alignment, and audit trails — in a domain familiar to enterprise buyers across industries (banking, insurance, retail, public sector all onboard vendors).

The domain is explicitly modelled on prior enterprise AI work at NSCS B.V., adapted into a publicly demonstrable portfolio.

---

## Alternatives Considered

**IT helpdesk automation**  
Well-understood, widely demonstrated, high volume of existing RAG + LLM examples. Rejected because it is the most common AI portfolio domain — it provides no differentiation. Peer architects have seen dozens of helpdesk AI demos.

**HR onboarding**  
Similar coordination complexity to vendor onboarding. Rejected because HR data sensitivity limits what can be shown publicly. Demonstrating an HR AI system requires careful data handling that adds non-architectural complexity to the portfolio.

**Procurement workflow**  
Close overlap with vendor onboarding. Narrower audience — fewer peer architects have direct experience with procurement systems than with vendor management.

**Customer support AI**  
High volume, clear business value. Lower governance complexity — customer support AI does not typically require multi-department approval chains, compliance sign-offs, or audit trails. The governance requirements of vendor onboarding are what allows the platform to demonstrate HITL, RBAC, and audit architecture in context.

---

## Accepted Tradeoff

Vendor onboarding requires domain explanation before architectural decisions make sense to evaluators without enterprise procurement experience. A simpler domain (IT helpdesk) would be immediately legible to any reviewer. Vendor onboarding requires 2-3 minutes of context before the approval workflow, compliance coordination, and document validation make sense as architectural requirements.

This is accepted because the domain complexity is what surfaces the architectural complexity. A simpler domain would not require HITL, multi-role RBAC, or compliance-aware retrieval — the platform features would appear over-engineered rather than necessary.
