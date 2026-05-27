# ADR-020 — SQLite-backed internal notification bell; email gateway deferred

**Status:** Accepted — May 2026  

**Layer:** 🟠 Shared
> Applies to all FlowPilot services that emit notification events. The `NotificationService` interface (ADR-018) is the permanent contract. The SQLite adapter is the Day 9 demo implementation. Email is the documented production upgrade path.  
**Deciders:** Nitin Soekhai (NSCS B.V.)

---

## Context

The Admin Document Upload module must notify users of scan and ingestion outcomes: infected documents must alert an admin immediately; successfully ingested documents must confirm to the uploader that the document is available. This requires a notification delivery mechanism.

Email is the natural production choice but introduces a provisioning dependency: verified sending domain, DNS SPF/DKIM records, SMTP relay or Azure Communication Services account, and a Data Processing Agreement for transactional email. This is an infrastructure provisioning problem, not a code problem. Blocking document upload delivery on email provisioning is unnecessary.

The `NotificationService` interface (ADR-018) is designed for adapter substitution. The demo adapter must be self-contained and require no external services.

---

## Decision

**Internal notification system backed by a SQLite `notifications` table. The React UI displays a bell icon with unread count. Email delivery is deferred to v2.**

**Interface:**
```python
class NotificationService:
    def send(self, recipient_id: str, event_type: str, payload: dict) -> None
    def get_unread(self, recipient_id: str) -> List[Notification]
    def mark_read(self, notification_id: str) -> None
```

Domain logic calls `send()` only. The SQLite adapter writes to the `notifications` table. The UI polls `get_unread()` on the same interval as the existing event feed (ADR-013). `mark_read()` is called when the user opens the notification.

**Events that trigger notifications:**

| Event | Recipient | Payload |
|-------|-----------|---------|
| `document.scan.failed` | Admin (all users with admin role) | `filename`, `uploaded_by`, `scan_result` |
| `document.ingestion.completed` | Uploader | `filename`, `chunk_count`, `document_id` |
| `document.ingestion.failed` | Uploader + admin | `filename`, `error_reason` |

---

## Alternatives Considered

**Email via SMTP (SendGrid, AWS SES, or direct relay)**  
Requires verified sending domain, SPF/DKIM DNS records, and a provider account. Portfolio demo cannot depend on these being provisioned. Rejected at Day 9 scope — documented as the v2 production path.

**Azure Communication Services (ACS)**  
Production-grade email and SMS. Requires Azure subscription, ACS resource, and a verified domain. The `NotificationService` interface accommodates an ACS adapter — this is explicitly the production upgrade path. Rejected at Day 9 scope for the same provisioning reasons as SMTP.

**WebSocket push notifications**  
Real-time delivery without polling. Adds WebSocket infrastructure (connection management, reconnection, backpressure) beyond Day 9 scope. The existing UI polling interval (ADR-013) is sufficient for notification delivery latency at portfolio scale.

**Logline-only (no UI notification)**  
Audit events (ADR-010, ADR-019) already capture all scan and ingestion outcomes in structured logs. Sufficient for operator observability but not for end-user notification — the uploader has no visibility into log output. Rejected: user-facing notification is a distinct concern from operator observability.

---

## Accepted Tradeoff

Users must actively check the UI for notifications. There is no email push in Day 9. This is documented explicitly so it is not perceived as an oversight — it is a deliberate scope decision driven by provisioning constraints, not a missing feature.

The `NotificationService` interface is the durable deliverable. Swapping to Azure Communication Services for email requires: one new adapter file, `NOTIFICATION_ADAPTER=acs` environment variable, ACS connection string in Key Vault — no domain code changes.

---

## Testability

The SQLite `NotificationService` adapter is deterministic and requires no external services. Unit tests assert:

- `send()` writes the correct record to the `notifications` table
- `get_unread()` returns only unread records for the given recipient
- `mark_read()` sets `read_at` timestamp and removes the record from `get_unread()` results

Notification triggering is tested by injecting events through the scan boundary (ADR-019) and ingestion pipeline and asserting that the correct `NotificationService.send()` calls are made with the correct `event_type` and `payload`. No email delivery infrastructure is required for any unit test.
