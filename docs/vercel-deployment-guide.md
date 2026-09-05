# ⚡ Deploying WhatsApp Student Helpdesk Assistant to Vercel

This repository is pre-configured for **Vercel Serverless Deployment** with zero friction.

---

## 🏗️ How Vercel Architecture Works

- **Entry Point**: [`api/index.ts`](file:///c:/Users/A/OneDrive/Documents/DevOps%20tasks/Whatsapp-bot/api/index.ts) exports the Express application as a Vercel Serverless Function.
- **Routing**: [`vercel.json`](file:///c:/Users/A/OneDrive/Documents/DevOps%20tasks/Whatsapp-bot/vercel.json) rewrites all inbound paths (`/webhooks/whatsapp`, `/health`, etc.) to the serverless function handler.
- **HTTPS & SSL**: Vercel automatically issues an SSL certificate, providing a public `https://<your-project>.vercel.app` URL for Meta WhatsApp Webhooks.

---

## 🚀 3-Step Deployment Guide

### Step 1: Push Code to GitHub
Ensure all code is committed and pushed to your GitHub repository:
```bash
git push origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** > **"Project"**.
3. Select the **`Whatsapp-Bot`** repository from your GitHub account.
4. Framework Preset: Choose **Other** (Vercel automatically detects `api/index.ts` and `vercel.json`).
5. Open **Environment Variables** and add the following:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment |
| `WHATSAPP_VERIFY_TOKEN` | `dev_hod_helpdesk_verify_token_2026` | Token for Meta verification |
| `WHATSAPP_API_TOKEN` | `EAAck7f...` | Meta Graph API permanent access token |
| `WHATSAPP_PHONE_NUMBER_ID` | `2351714665655922` | WhatsApp sender phone number ID |
| `WHATSAPP_APP_SECRET` | `d900cb1...` | Meta App secret for HMAC signatures |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `1322785187586265` | Meta WABA ID |
| `WHATSAPP_MOCK_MODE` | `false` | `false` to send real WhatsApp messages |
| `HOD_WHATSAPP_NUMBER` | `919876543210` | HOD phone number for in-chat alerts |
| `DEFAULT_GOOGLE_FORM_URL` | *(your google form url)* | Google Form link sent to students |
| `USE_MEMORY_STORE` | `true` (or configure `DATABASE_URL`) | Set `true` for zero-setup, or use Neon/Supabase PostgreSQL |
| `DATABASE_URL` | *(optional)* | Connection pooled URL from Neon / Supabase |

6. Click **Deploy**.

---

### Step 3: Configure Meta Webhook URL

Once Vercel finishes deploying (usually under 1 minute):
1. Copy your Vercel deployment URL (e.g. `https://whatsapp-bot-xxxx.vercel.app`).
2. Go to [Meta for Developers](https://developers.facebook.com/apps/) > Your App > **WhatsApp** > **Configuration**.
3. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://<YOUR-PROJECT>.vercel.app/webhooks/whatsapp`
   - **Verify Token**: Enter your `WHATSAPP_VERIFY_TOKEN` (e.g., `dev_hod_helpdesk_verify_token_2026`)
4. Click **Verify and Save**.
5. Under **Webhook fields**, subscribe to **`messages`**.

---

## 🗄️ Database Options on Vercel

Because Vercel functions are serverless:
1. **Quickest Setup (Zero DB Configuration)**:
   - Set `USE_MEMORY_STORE=true` in Vercel Environment Variables.
   - The bot will store conversation states and reference IDs in memory.
2. **Persistent Production Database (Recommended)**:
   - Use a free serverless PostgreSQL database from **Neon** ([neon.tech](https://neon.tech)) or **Supabase** ([supabase.com](https://supabase.com)).
   - Paste the connection string into Vercel as `DATABASE_URL`:
     ```text
     postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Run migrations once using:
     ```bash
     npm run migrate
     ```
