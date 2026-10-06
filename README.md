# ⚡ Dayflow — Intelligent HR Management System

> **AI-powered HRMS** that automates employee request approvals using Google Gemini, n8n workflows, Supabase, and Google Workspace integrations.

![Dayflow](https://img.shields.io/badge/Status-Production_Ready-6366f1?style=for-the-badge&logo=lightning&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)
![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-4285f4?style=flat-square&logo=google)

---

## 📐 Architecture Overview

```
Employee (Browser)
    │
    ▼ (React + Tailwind + Zod)
Supabase DB (INSERT)
    │
    ▼ (DB Webhook)
n8n Workflow
    ├── Gemini 2.5 Flash (AI Evaluation)
    ├── Supabase PATCH (status + ai_evaluation_json)
    ├── Google Calendar (if approved)
    ├── Google Sheets (tracker append)
    └── Gmail (decision email)
    │
    ▼ (Realtime subscription)
Dashboard (live status update)
```

---

## 🛠 Tech Stack

| Layer            | Technology                                  |
|------------------|---------------------------------------------|
| Frontend         | React 18, Vite, Tailwind CSS v3             |
| Validation       | Zod, React Hook Form                        |
| Backend / DB     | Supabase (PostgreSQL, Auth, RLS, Realtime)  |
| AI Engine        | Google Gemini 2.5 Flash (`@google/genai`)   |
| Workflow         | n8n (self-hosted or n8n Cloud)              |
| Integrations     | Google Sheets, Gmail, Google Calendar       |
| Deployment       | Vercel                                      |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [n8n](https://n8n.io) instance (cloud or self-hosted)
- Google Cloud project with Sheets, Calendar, Gmail APIs enabled
- Google Gemini API key ([AI Studio](https://aistudio.google.com))

---

## Phase 1 — Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon key** (Settings → API)
3. Note your **Service Role Key** (needed for n8n only — never expose in frontend)

### 1.2 Run the Schema
1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run** — this creates tables, indexes, RLS policies, and the auto-profile trigger

### 1.3 Enable Realtime
Dashboard → **Database** → **Replication** → Enable `employee_requests` table

### 1.4 Configure Database Webhook (fires n8n)
Dashboard → **Database** → **Webhooks** → **Create Webhook**:
- **Name**: `trigger-n8n-on-insert`
- **Table**: `employee_requests`
- **Events**: `INSERT`
- **URL**: `https://your-n8n-instance/webhook/evaluate-request`
- **Headers**: Add `x-webhook-secret: YOUR_SECRET_VALUE`

---

## Phase 2 — Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL and anon key in .env
npm install
npm run dev
```

Your app runs at `http://localhost:5173`

---

## Phase 3 — n8n Workflow Setup

### 3.1 Import the Workflow
1. Open your n8n instance → **Workflows** → **Import from File**
2. Import [`n8n-workflows/dayflow-approval-pipeline.json`](./n8n-workflows/dayflow-approval-pipeline.json)

### 3.2 Configure Credentials
In n8n, create the following credentials:

**Google Workspace OAuth2** (used by Sheets, Calendar, Gmail nodes):
- Type: `Google OAuth2 API`
- Scopes: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/spreadsheets`, `https://www.googleapis.com/auth/gmail.send`

**Gemini API Key** (HTTP Query Auth):
- Type: `HTTP Query Auth`
- Name: `key`
- Value: `your_gemini_api_key`

### 3.3 Set n8n Environment Variables
In n8n → **Settings** → **Environment Variables**:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_SHEET_ID=your_google_sheet_id
WEBHOOK_SECRET=your_webhook_secret_value
```

### 3.4 Activate the Workflow
Toggle the workflow to **Active** — the webhook is now live.

---

## Phase 4 — Google Workspace Setup

### Google Sheet Tracker
1. Create a new Google Sheet
2. Name Sheet 1 as **"Requests"**
3. Add headers in Row 1: `ID | Employee_ID | Request_Type | Start_Date | End_Date | Urgency | Status | AI_Decision | AI_Reasoning | Timestamp`
4. Copy the Sheet ID from the URL and set `GOOGLE_SHEET_ID` in n8n

### Google Calendar
The workflow creates events on the **primary** calendar of the OAuth2 user. Change `calendarId` in the workflow node if using a dedicated HR calendar.

---

## Phase 5 — Vercel Deployment

```bash
# From project root
npx vercel --prod
```

Or connect your GitHub repo in [Vercel Dashboard](https://vercel.com):
- **Root directory**: `frontend`
- **Build command**: `npm run build`
- **Output dir**: `dist`

Set these environment variables in Vercel:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📁 Project Structure

```
/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx                          # Router + AuthProvider
│       ├── main.jsx                         # React entry point
│       ├── index.css                        # Tailwind + custom styles
│       ├── lib/
│       │   ├── supabase.js                  # Supabase client singleton
│       │   └── utils.js                     # Helpers (cn, formatDate…)
│       ├── schemas/
│       │   └── index.js                     # Zod validation schemas
│       ├── contexts/
│       │   └── AuthContext.jsx              # Auth state + profile
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.jsx            # Sidebar + nav shell
│       │   │   └── ProtectedRoute.jsx       # Auth + role guard
│       │   └── ui/
│       │       ├── StatusBadge.jsx          # Color-coded status pill
│       │       ├── DashboardGrid.jsx        # Request card grid
│       │       └── RequestDetailModal.jsx   # AI evaluation modal
│       └── pages/
│           ├── AuthPage.jsx                 # Login / Register
│           ├── DashboardPage.jsx            # Home + realtime requests
│           ├── NewRequestPage.jsx           # Request submission form
│           └── AdminPage.jsx                # Admin table view
├── n8n-workflows/
│   └── dayflow-approval-pipeline.json      # Full n8n workflow
├── supabase/
│   └── schema.sql                           # DB schema + RLS + trigger
├── vercel.json                              # Vercel SPA deployment config
└── README.md
```

---

## 🔐 Security Notes

| Concern | Solution |
|---|---|
| API keys | Service Role Key only in n8n env vars, never in frontend |
| DB access | RLS enforces user isolation; admin role required for full view |
| Webhook auth | `x-webhook-secret` header validated in n8n Code node |
| Route access | `ProtectedRoute` blocks unauthenticated users; `requireAdmin` blocks non-admins |
| AI processing | All Gemini calls happen server-side in n8n |

---

## 🎯 Acceptance Criteria Checklist

- [x] Users can create accounts and log in securely via Supabase Auth
- [x] Submitting a request writes a correctly structured record respecting RLS
- [x] Supabase DB Webhook fires the n8n pipeline on INSERT
- [x] Gemini 2.5 Flash returns structured JSON (decision, reasoning, calendar flag, sentiment)
- [x] Supabase record is PATCHed with AI result using Service Role Key (bypasses RLS)
- [x] Google Calendar event created for approved PTO/Sick Leave
- [x] Google Sheets tracker updated for every request
- [x] Decision email sent via Gmail with HTML template
- [x] Dashboard updates in real-time via Supabase Realtime subscription
- [x] Admin view shows all requests with search, filter, sort, and CSV export
- [x] UI is fully responsive (mobile-first with collapsible sidebar)

---

## 📄 License

MIT — Built for the Built to Ship 2K26 hackathon.