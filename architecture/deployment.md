# Deployment Diagram — Docker Local + Azure Reference

```mermaid
flowchart TD
    subgraph LOCAL ["Docker Host · local dev · docker-compose.yml"]
        RS["rag-service\nFastAPI · LangChain · :8000"]
        VO["vendor-onboarding\nFastAPI · LangGraph · :8001"]
        QD["qdrant\nVector store · :6333"]
        SV[("shared volume\nSQLite · bind mount")]
        NET(["flowpilot-net\nbridge network"])
        RS & VO & QD & SV --- NET
    end

    subgraph AZURE ["Azure · reference target"]
        subgraph AKS ["AKS cluster · Kubernetes · autoscale"]
            RSP["rag-service pod · :8000"]
            VOP["vendor-onboarding pod · :8001"]
        end
        ACR["Azure Container Registry\nDocker image store"]
        AIS["Azure AI Search\nreplaces Qdrant in prod"]
        AKV["Azure Key Vault\nsecrets management"]
        ACR -->|pull image| AKS
        AKS --> AIS
        AKS --> AKV
    end
```

## Environment comparison

| Concern | Docker local | Azure reference |
|---|---|---|
| Orchestration | docker-compose | AKS (Kubernetes) |
| Vector store | Qdrant container | Azure AI Search |
| Secrets | `.env` file | Azure Key Vault |
| Image registry | local build | Azure Container Registry |
| Scaling | single instance | pod autoscale |
| SQLite | bind mount volume | Azure Files or Postgres (TBD) |
