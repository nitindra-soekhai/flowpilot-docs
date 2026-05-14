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
    ASSESSMENT ||--o{ APPROVAL_REQUEST : "requires"
    ASSESSMENT ||--o{ AUDIT_EVENT : "generates"
    ASSESSMENT ||--|| WORKFLOW_STATE : "tracked by"
    POLICY_DOCUMENT ||--o{ POLICY_CHUNK : "chunked into"
    USER ||--o{ ASSESSMENT : "initiates"
    USER ||--o{ APPROVAL_REQUEST : "decides"
```

## Notes

- `AUDIT_EVENT.trace_id` is the cross-cutting correlation key — every entity that participates in a workflow produces audit events tied to the same trace ID
- `WORKFLOW_STATE` is 1:1 with `ASSESSMENT` — one state machine per assessment run
- `POLICY_CHUNK.qdrant_point_id` is the foreign key into Qdrant — SQLite and Qdrant stay in sync via this field
- `USER.roles` is a JSON array — stubbed for portfolio; production replaces with IdP claims
