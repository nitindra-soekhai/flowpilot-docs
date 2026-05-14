# C4 Level 2 — Container Diagram

```mermaid
C4Container
  title FlowPilot — Container Diagram (C4 Level 2)

  Person(coordinator, "Onboarding Coordinator", "Initiates and tracks vendor onboarding")
  Person(approver, "Approver", "Reviews and approves onboarding stages")
  Person_Ext(vendor, "Vendor", "Submits documentation and questionnaires")

  System_Boundary(fp, "FlowPilot Platform") {
    Container(onboarding, "flowpilot-vendor-onboarding", "Python · FastAPI · LangGraph · :8001", "Onboarding workflow execution and HITL approval gateway")
    Container(rag, "flowpilot-rag-service", "Python · FastAPI · LangChain · :8000", "Policy retrieval — hybrid dense and sparse search")
    Container(rbac, "RBAC Middleware", "Python · Shared library", "JWT decode, role extraction, permission enforcement, 403 audit logging")
    ContainerDb(sqlite, "SQLite", "SQLite · file", "Workflow state, audit log, user stubs")
    ContainerDb(qdrant, "Qdrant", "Vector database · :6333", "Policy document embeddings")
  }

  System_Ext(openai, "OpenAI API", "Embedding and completion models")
  System_Ext(procurement, "Procurement Platform", "Supplier records, PO workflows")
  System_Ext(ticketing, "Ticketing System", "Tasks and escalations")
  System_Ext(hr, "HR System", "Employee identity and org structure")
  System_Ext(email, "Email and Notifications", "Approval alerts and status updates")
  System_Ext(compliance, "Compliance System", "Policy repository and risk registers")

  Rel(coordinator, onboarding, "Start onboarding, track status", "HTTPS")
  Rel(approver, onboarding, "Review and approve", "HTTPS")
  Rel_Ext(vendor, onboarding, "Submit documents and questionnaires", "HTTPS")

  Rel(onboarding, rbac, "Validate JWT, check permission", "In-process import")
  Rel(rag, rbac, "Validate JWT, check permission", "In-process import")
  Rel(onboarding, rag, "Request policy retrieval", "HTTP REST")
  Rel(onboarding, sqlite, "Read and write workflow state and audit log", "SQLite")
  Rel(rag, qdrant, "Search and upsert policy embeddings", "gRPC")
  Rel(rag, sqlite, "Log retrieval events", "SQLite")
  Rel(rag, openai, "Call embedding model", "HTTPS")
  Rel(onboarding, openai, "Call completion model", "HTTPS")
  Rel(onboarding, procurement, "Read supplier records", "REST")
  Rel(onboarding, ticketing, "Create tasks, log escalations", "REST")
  Rel(onboarding, hr, "Resolve employee identity", "REST")
  Rel(onboarding, email, "Send notifications and alerts", "SMTP and REST")
  Rel(onboarding, compliance, "Read policies, write audit events", "REST")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```
