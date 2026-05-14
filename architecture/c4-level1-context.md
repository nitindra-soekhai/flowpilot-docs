# C4 Level 1 — System Context

```mermaid
C4Context
  title FlowPilot — System Context (C4 Level 1)

  Person(coordinator, "Onboarding Coordinator", "Enterprise employee who initiates and manages vendor onboarding")
  Person(approver, "Approver", "Procurement, security, legal, compliance, or IT stakeholder who reviews and approves")
  Person_Ext(vendor, "Vendor", "External supplier providing documentation and responding to assessments")

  System(flowpilot, "FlowPilot Platform", "AI-assisted vendor onboarding coordination — guidance, workflow execution, approval orchestration, and compliance coordination")

  System_Ext(openai, "OpenAI API", "Embedding model (text-embedding-3-small) and completion model (GPT-4o)")
  System_Ext(qdrant_ext, "Qdrant", "Vector store for policy document embeddings")
  System_Ext(procurement, "Procurement Platform", "Purchase orders, supplier records, contract lifecycle")
  System_Ext(ticketing, "Ticketing System", "Work items, task tracking, escalations")
  System_Ext(hr, "HR System", "Employee identity, roles, org structure")
  System_Ext(email, "Email and Notification Service", "Stakeholder notifications and escalation alerts")
  System_Ext(compliance, "Compliance System", "Policy repository, audit trails, risk registers")

  Rel(coordinator, flowpilot, "Starts onboarding, asks questions, tracks progress", "HTTPS")
  Rel(approver, flowpilot, "Reviews and approves onboarding stages", "HTTPS")
  Rel_Ext(vendor, flowpilot, "Submits documentation and questionnaires", "HTTPS")

  Rel(flowpilot, openai, "Calls embedding and completion models", "HTTPS")
  Rel(flowpilot, qdrant_ext, "Searches and upserts policy vectors", "gRPC")
  Rel(flowpilot, procurement, "Reads supplier records, triggers PO workflows", "REST")
  Rel(flowpilot, ticketing, "Creates tasks, logs escalations", "REST")
  Rel(flowpilot, hr, "Resolves employee identity and roles", "REST")
  Rel(flowpilot, email, "Sends approval requests and status alerts", "SMTP / REST")
  Rel(flowpilot, compliance, "Retrieves policies, writes audit events", "REST")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```
