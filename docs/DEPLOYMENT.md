# KindDoor Production Deployment Guide

## 1. Deployment Architecture Overview
KindDoor can be deployed to any modern cloud infrastructure supporting Node.js containers (AWS ECS, AWS App Runner, Fly.io, DigitalOcean, or Docker Compose).

```mermaid
graph LR
    User[Resident / Web Browser] --> CDN[CloudFront / Vercel / Nginx]
    CDN --> Web[Next.js App (:3000)]
    Web --> Backend[Fastify & MCP Server (:4000)]
    Ring[Ring Doorbell] -->|Webhook| Backend
    Backend --> DB[(PostgreSQL / RDS)]
    Backend --> Bedrock[Amazon Bedrock API]
```

---

## 2. Docker Deployment

### 2.1. Local Multi-Container Deployment via Docker Compose
To run local PostgreSQL alongside KindDoor:
```bash
docker-compose up -d
```

### 2.2. Environment Configuration in Production
Set the following environment variables in your container runtime:
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=https://kinddoor.yourdomain.com
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/kinddoor?schema=public
ACCESS_TOKEN_SECRET=your_32_char_production_hex_secret_here
RING_WEBHOOK_SECRET=your_production_ring_signing_secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_iam_access_key
AWS_SECRET_ACCESS_KEY=your_iam_secret_key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

---

## 3. Production Health Monitoring
- Health Check Endpoint: `GET https://api.yourdomain.com/health`
- Expected Status Payload:
  ```json
  {
    "status": "HEALTHY",
    "service": "kinddoor-backend-server",
    "environment": "production",
    "mcp": "ENABLED_STREAMABLE_HTTP",
    "bedrock": "CONFIGURED",
    "ring": "INTEGRATED_SIMULATOR_ACTIVE"
  }
  ```
