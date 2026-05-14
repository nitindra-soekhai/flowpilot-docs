# C4 Level 3 — Component Model: flowpilot-vendor-onboarding

```mermaid
flowchart TD
    subgraph VO ["flowpilot-vendor-onboarding · FastAPI · :8001"]
        TM("TraceMiddleware")
        AC["AssessmentController"]
        LG["LangGraphOrchestrator"]
        PRT["PolicyRetrievalTool"] --> RSC["RAGServiceClient"]
        RAT["RiskAssessmentTool"] --> LLM["LLMClient"]
        HG["HITLGateway"] --> WSR[("WorkflowStateRepository")]
        DLH["DeadLetterHandler"]
        DMH["DegradedModeHandler"]
    end

    TM --> AC --> LG
    LG --> PRT & RAT & HG
    LG -.->|on failure| DLH
    RSC -.->|on unavailable| DMH

    RSC -->|HTTP REST| RAGS["flowpilot-rag-service :8000"]
    LLM -->|HTTPS| OAI["OpenAI API"]
    WSR -->|SQLite| DB[("SQLite")]
```

## Component responsibilities

| Component | Responsibility |
|---|---|
| TraceMiddleware | Injects trace ID; propagates user_context through graph |
| AssessmentController | Handles POST /assessments — validates input, initiates graph |
| LangGraphOrchestrator | Stateful 4-node agent graph: collect → retrieve → assess → approve |
| PolicyRetrievalTool | LangGraph tool node — calls RAGServiceClient |
| RAGServiceClient | HTTP client for flowpilot-rag-service; triggers DegradedModeHandler on failure |
| RiskAssessmentTool | LangGraph tool node — calls LLMClient for risk scoring |
| LLMClient | OpenAI GPT-4o client; constructs risk prompt with grounded policy chunks |
| HITLGateway | LangGraph tool node — routes to human approver; persists approval state |
| WorkflowStateRepository | SQLite-backed state persistence for LangGraph checkpointing |
| DeadLetterHandler | Captures failed agent runs for retry or manual triage |
| DegradedModeHandler | Fallback behaviour when RAG service is unavailable |
