# 🚀 DevOps Deployment & Pure WhatsApp Automation Guide

This guide documents the **zero-dashboard**, **pure WhatsApp-native** operational workflow and the automated **DevOps CI/CD pipelines** for running the WhatsApp Student Helpdesk Assistant 24/7 in production.

---

## 📱 1. Pure WhatsApp Architecture (No Dashboard Needed)

Everything operates directly inside WhatsApp without requiring any external web dashboard:

```mermaid
flowchart TD
    Student[Student on WhatsApp] -->|Query / Requirement| Bot[Node.js Helpdesk Bot]
    Bot -->|Instant Approved FAQ| Student
    Bot -->|Official Google Form Link + Ref ID| Student
    
    subgraph WhatsApp-Only Administrative Control
        HOD[HOD on WhatsApp]
        Bot -->|🚨 Urgent Escalation Alert| HOD
        Bot -->|📋 Form Submission Ping| HOD
        HOD -->|`PENDING` / `LIST`| Bot
        HOD -->|`APPROVE <REF> [note]`| Bot
        HOD -->|`REJECT <REF> [reason]`| Bot
        Bot -->|🎉 Direct Outbound Approval Msg| Student
    end
```

### Student Experience

- **FAQs**: Instant answers on HOD office hours, room number, syllabus, attendance policy, fees.
- **Formal Requirements**: Generates an institutional reference ID (`HOD-REQ-YYYYMMDD-XXXX`) and provides the official department Google Form link.
- **Status Tracking**: Student sends `STATUS <REF>` or simply paste their reference ID (e.g., `HOD-REQ-20260905-2E7316`) into the chat to check current approval status and notes.

### HOD Direct WhatsApp In-Chat Management

When `HOD_WHATSAPP_NUMBER` is configured in `.env`, the HOD can control everything from WhatsApp on their phone:

| Command | Description | Action Taken |
| :--- | :--- | :--- |
| `PENDING` or `LIST` | Shows open student requests awaiting review | Displays top pending requests with reference IDs, categories, and form status |
| `APPROVE <REF> [notes]` | Approves student requirement | Updates status to `RESOLVED` in DB and **automatically dispatches an official WhatsApp approval message** to the student |
| `REJECT <REF> [reason]` | Declines or requests revision | Updates status to `CLOSED` in DB and **automatically sends feedback message** to student |
| `STATUS <REF>` | View specific case details | Shows category, full student inquiry, form link status, and timestamps |
| `HELP` | Command menu | Lists all available HOD actions |

---

## ⚙️ 2. DevOps Deployment Automations

### Option A: Render Cloud Blueprint (Recommended — 100% Automated Git-Push Continuous Deployment)

The repository includes `render.yaml` infrastructure-as-code for Render.

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** > **Blueprint**.
2. Connect your GitHub repository: `https://github.com/nivas4506/Whatsapp-Bot.git`.
3. Render reads `render.yaml` and automatically provisions:
   - **Web Service**: Multi-stage Alpine Docker container running on port `3000`.
   - **PostgreSQL Database**: Free managed PostgreSQL database.
   - **Automated SSL**: Free trusted HTTPS certificate with zero configuration.
4. Set your Meta secrets in the Render environment dashboard:
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_API_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET`
   - `HOD_WHATSAPP_NUMBER` (your WhatsApp number with country code, e.g. `919876543210`)
5. Click **Apply Blueprint**.
6. Every `git push origin main` will automatically build, test, migrate, and deploy your live bot!
7. Copy your live Render URL (e.g. `https://whatsapp-hod-bot.onrender.com`) and set your Meta Webhook URL:

   ```text
   https://whatsapp-hod-bot.onrender.com/webhooks/whatsapp
   ```

---

### Option B: Self-Hosted Production VPS / VM (AWS EC2 / DigitalOcean / Hetzner)

The repository includes `docker-compose.prod.yml` and `scripts/deploy.sh`:

1. Clone repository to your server:

   ```bash
   git clone https://github.com/nivas4506/Whatsapp-Bot.git /opt/whatsapp-bot
   cd /opt/whatsapp-bot
   ```

2. Copy environment file and fill in production secrets:

   ```bash
   cp .env.example .env
   nano .env
   ```

3. Run the automated deployment script:

   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

   *This script automatically pulls changes, builds containers, runs PostgreSQL migrations, checks health at `/health`, and restarts containers with zero downtime.*

---

## 🔄 3. Continuous Integration & Continuous Deployment (GitHub Actions)

The repository includes complete GitHub Actions workflows:

### CI Pipeline (`.github/workflows/ci.yml`)

Triggered on every commit and Pull Request to `main`:

1. **Node 22 Setup & Dependency Installation** (`npm ci` with cache).
2. **TypeScript Compilation & Linting** (`npm run lint` / `tsc --noEmit`).
3. **Database Migrations** against automated PostgreSQL 16 service container.
4. **Automated Test Suite** (Vitest running 24 unit & integration tests).
5. **Security Audit** (`npm audit --audit-level=high`).
6. **Docker Multi-Stage Build Validation** (`Dockerfile` build test).

### CD Pipeline (`.github/workflows/cd.yml`)

Triggered automatically when code is pushed to `main`:

1. Builds production multi-stage Alpine container.
2. Publishes versioned and `latest` tags to **GitHub Container Registry** (`ghcr.io/nivas4506/whatsapp-bot:latest`).
3. If `DEPLOY_HOOK_URL` secret is configured in GitHub repository secrets, triggers automated redeployment webhook on your cloud host.

---

## 🔗 4. Connecting Meta WhatsApp & Google Forms to Production

### Meta WhatsApp Webhook

1. Go to [Meta for Developers](https://developers.facebook.com/apps/) > Your App > **WhatsApp** > **Configuration**.
2. Under **Webhook**, click **Edit**.
3. **Callback URL**: `https://<YOUR_PRODUCTION_DOMAIN>/webhooks/whatsapp`
4. **Verify Token**: Must match `WHATSAPP_VERIFY_TOKEN` in your environment.
5. Click **Verify and Save**.
6. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages`

### Google Forms Sync

1. Open your Google Form > Script Editor.
2. In `scripts/google-apps-script/Code.gs`, set `WEBHOOK_URL`:

   ```javascript
   var WEBHOOK_URL = "https://<YOUR_PRODUCTION_DOMAIN>/internal/forms/responses/sync";
   ```

3. Save and create an **On form submit** trigger.
4. Every student form submission will instantly sync with the bot, notify the student on WhatsApp, and ping the HOD!
