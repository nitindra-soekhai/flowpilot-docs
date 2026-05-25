# Information Model — Domain Entities

```mermaid
erDiagram
    VENDOR {
        uuid id PK
        string name
        string category
        string tier
        string status
    }
    VENDOR_REGISTRY {
        uuid id PK
        uuid vendor_id FK
        string registry_status
        string approved_by
        string approved_at
        string last_assessed_at
        int assessment_count
        string notes
    }
    REASSESSMENT {
        uuid id PK
        uuid vendor_id FK
        uuid triggered_by FK
        string reason
        string status
        string created_at
    }
    ASSESSMENT {
        uuid id PK
        uuid vendor_id FK
        string initiated_by FK
        string risk_level
        float confidence_score
        string status
        string trace_id
    }
    APPROVAL_REQUEST {
        uuid id PK
        uuid assessment_id FK
        string approver_role
        string status
        string decision
    }
    WORKFLOW_STATE {
        uuid id PK
        uuid assessment_id FK
        string phase
        json state_data
    }
    POLICY_DOCUMENT {
        uuid id PK
        string source
        string version
        string content_hash
    }
    POLICY_CHUNK {
        uuid id PK
        uuid document_id FK
        int chunk_index
        string qdrant_point_id
    }
    AUDIT_EVENT {
        uuid id PK
        string trace_id
        string operation
        string actor
        string outcome
    }
    USER {
        uuid id PK
        string email
        json roles
    }

    VENDOR ||--o{ ASSESSMENT : "assessed via"
    VENDOR ||--|| VENDOR_REGISTRY : "registered in"
    VENDOR ||--o{ REASSESSMENT : "re-assessed via"
    USER ||--o{ REASSESSMENT : "triggers"
    ASSESSMENT ||--o{ APPROVAL_REQUEST : "requires"
    ASSESSMENT ||--o{ AUDIT_EVENT : "generates"
    ASSESSMENT ||--|| WORKFLOW_STATE : "tracked by"
    POLICY_DOCUMENT ||--o{ POLICY_CHUNK : "chunked into"
    USER ||--o{ ASSESSMENT : "initiates"
    USER ||--o{ APPROVAL_REQUEST : "decides"
```

## Notes

- `VENDOR_REGISTRY` tracks approved vendors post-onboarding — added in v1.2. Prevents duplicate onboarding of already-registered vendors.
- `REASSESSMENT` supports periodic re-evaluation of existing vendors — triggers a new assessment workflow without creating a new vendor record.


- `AUDIT_EVENT.trace_id` is the cross-cutting correlation key — every entity that participates in a workflow produces audit events tied to the same trace ID
- `WORKFLOW_STATE` is 1:1 with `ASSESSMENT` — one state machine per assessment run
- `POLICY_CHUNK.qdrant_point_id` is the foreign key into Qdrant — SQLite and Qdrant stay in sync via this field
- `USER.roles` is a JSON array — stubbed for portfolio; production replaces with IdP claims
