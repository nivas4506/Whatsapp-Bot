# WhatsApp Student Helpdesk Assistant for the HOD

A production-grade, DevOps-enabled WhatsApp assistant that acts as a first-level helpdesk agent for the Head of Department (HOD) and Department Administration. Built strictly in accordance with the [Product Requirements Document](./Product_Requirements_Document.md) and [System Design PRD](./System_Design_Product_Requirements_Document.md).

---

## Key Features

1. **Official WhatsApp Cloud API Integration Layer**:
   - Webhook endpoint with HMAC-SHA256 signature verification (`X-Hub-Signature-256`) and Meta verification handshake (`hub.challenge`).
   - Normalizes nested Meta payloads into clean domain events.
   - Outbound client supporting plain text, interactive quick-reply buttons, and CTA URL buttons for Google Forms.
   - Built-in local mock mode for development and automated testing without live credentials.

2. **Grounded FAQ Knowledge Base & Zero Hallucinations**:
   - Answering routine queries (office hours, timings, exam policies, attendance rules) strictly from an approved department FAQ repository with owners and review dates.
   - Automatic fallback when unverified: never invents institutional policy.

3. **Structured Formal Requirements & Google Form Correlation**:
   - Captures formal student requirements (certificates, leave, attendance condonation, project approval, appointments).
   - Issues a unique departmental reference tracking code (e.g., `HOD-REQ-YYYYMMDD-XXXX`).
   - Dispatches the relevant official Google Form link as the final action.
   - Internal API to correlate Google Form submissions back to the requirement record.

4. **Risk Detection & Human-in-the-Loop Escalation**:
   - Automatically detects sensitive matters (harassment, ragging, legal disputes, threats, grade disputes) and explicit handoff requests ("talk to HOD").
   - Escalates directly to `HUMAN_REVIEW`, alerts HOD/administrators via structured notification channels, and provides emergency contacts.

5. **Production Relational Data Layer with PostgreSQL**:
   - Full PostgreSQL 16 persistence for contacts, conversations, messages (with duplicate prevention/idempotency), requirements, FAQs, and audit logs.
   - Automated idempotent database migration runner (`npm run migrate`).

6. **Enterprise DevOps & Cloud Infrastructure**:
   - **Docker**: Multi-stage, hardened, non-root Alpine container with dumb-init and health checks.
   - **Docker Compose**: Multi-container local orchestration (App + PostgreSQL 16 + Adminer).
   - **CI/CD**: GitHub Actions workflows for automated linting, type-checking, PostgreSQL-backed testing, security auditing, and container publishing.
   - **Kubernetes (K8s)**: Production manifests including Deployment (rolling update strategy & security contexts), ClusterIP Service, Ingress with cert-manager TLS, ConfigMap, Secrets, and Horizontal Pod Autoscaler (HPA).
   - **Observability**: Prometheus metrics endpoint (`/metrics`) and `/health/live` & `/health/ready` probes.
   - **Terraform (IaC)**: Infrastructure as Code for AWS VPC, private subnets, security groups, and Amazon RDS PostgreSQL 16.

---

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint, typecheck, DB migrations, Vitest & Docker validation
│       └── cd.yml               # Container build & publish to GitHub Container Registry (ghcr.io)
├── k8s/                         # Production Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment.yaml          # Rolling updates, non-root security context, probes
│   ├── service.yaml
│   ├── ingress.yaml             # Cert-manager TLS & HTTPS webhook termination
│   └── hpa.yaml                 # Horizontal Pod Autoscaler (2 to 10 replicas)
├── terraform/                   # Infrastructure as Code (AWS RDS PostgreSQL + VPC)
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── src/
│   ├── adapters/
│   │   └── whatsapp/
│   │       ├── types.ts         # Meta WhatsApp Cloud API schemas
│   │       ├── signature.ts     # HMAC-SHA256 signature verifier
│   │       ├── normalizer.ts    # Unpacks Meta payloads into domain format
│   │       └── client.ts        # Outbound message sender (Text, Buttons, CTA URLs)
│   ├── config/
│   │   ├── index.ts             # Zod environment schema
│   │   └── support-hours.ts     # Support hours evaluation logic
│   ├── core/
│   │   ├── state-machine.ts     # Conversation states & transition validation
│   │   ├── classifier.ts        # Intent & risk classification
│   │   └── orchestrator.ts      # Conversation orchestrator
│   ├── routes/
│   │   ├── webhook.ts           # /webhooks/whatsapp (GET & POST)
│   │   ├── requirements.ts      # /internal/requirements (GET & PATCH)
│   │   ├── forms-sync.ts        # /internal/forms/responses/sync (POST)
│   │   ├── health.ts            # /health/live & /health/ready
│   │   └── metrics.ts           # /metrics (Prometheus)
│   ├── services/
│   │   ├── faq-service.ts       # FAQ lookup
│   │   ├── form-registry.ts     # Google Form link resolver
│   │   └── notification-service.ts # HOD alert dispatcher
│   ├── simulator/
│   │   └── cli.ts               # Local interactive student chat simulator
│   ├── store/
│   │   ├── db.ts                # PostgreSQL connection pool & healthcheck
│   │   ├── migrate.ts           # Schema migration runner
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   └── repositories/        # Repository contracts & PG/Memory implementations
│   ├── types/                   # Core domain types
│   ├── app.ts                   # Express app configuration & middleware
│   └── server.ts                # HTTP server & graceful shutdown handling
├── tests/                       # Automated Vitest test suite (22 tests)
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Multi-container orchestration (App + Postgres)
├── package.json
└── tsconfig.json
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- Docker & Docker Compose (optional for containerized PostgreSQL)

### 2. Setup
```bash
# Clone and enter directory
npm install

# Copy environment variables
cp .env.example .env
```

### 3. Run Automated Tests
```bash
npm run test
```
All 22 unit and integration tests run in seconds using Vitest.

### 4. Interactive WhatsApp Terminal Simulator
To test the bot locally without configuring a Meta Developer account:
```bash
npm run simulator
```
Try queries like:
- `"Hi"`: Welcome message, privacy statement, and category options.
- `"What are HOD office hours?"`: Returns official timings and office location.
- `"I need a bonafide certificate for my passport"`: Creates requirement record, issues reference code (`HOD-REQ-...`), and delivers the official Google Form link.
- `"I want to report harassment and ragging"`: Triggers high-risk escalation, alerts HOD, and provides grievance procedure.
- `"Can I talk to HOD?"`: Triggers human handoff.

---

## Docker & Docker Compose Setup

Run the complete backend stack with PostgreSQL 16:
```bash
# Start PostgreSQL and Helpdesk service in background
docker-compose up --build -d

# View container status
docker-compose ps

# Check logs
docker-compose logs -f app
```

Verify service endpoints:
- **Health Check (Readiness)**: `curl http://localhost:3000/health/ready`
- **Prometheus Metrics**: `curl http://localhost:3000/metrics`
- **API Info**: `curl http://localhost:3000/`

---

## Kubernetes Deployment

Deploy to your Kubernetes cluster:
```bash
# 1. Create Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply ConfigMap & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. Deploy API Service & Ingress
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 4. Enable Horizontal Pod Autoscaling
kubectl apply -f k8s/hpa.yaml
```

---

## Terraform Infrastructure (AWS)

To provision a managed PostgreSQL 16 Amazon RDS instance and isolated VPC:
```bash
cd terraform
terraform init
terraform plan -var="db_password=YourSecurePassword123!"
terraform apply -var="db_password=YourSecurePassword123!"
```

---

## Meta WhatsApp Cloud API Setup

1. In the [Meta for Developers Portal](https://developers.facebook.com/), create a **Business App** and add the **WhatsApp** product.
2. In WhatsApp > Configuration:
   - **Callback URL**: `https://<your-domain>/webhooks/whatsapp`
   - **Verify Token**: Matches `WHATSAPP_VERIFY_TOKEN` in your `.env` or Kubernetes secret.
   - **Webhook Fields**: Subscribe to `messages`.
3. Set your `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_APP_SECRET`.
4. In production, set `WHATSAPP_MOCK_MODE=false`.
