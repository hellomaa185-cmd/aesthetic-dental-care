# Aesthetic Dental Clinic — Production Web Application

A modern, high-end digital clinical experience engineered for **Aesthetic Dental Clinic** (Indiranagar Atelier, Bengaluru). Features online consultation booking, server-side appointment hold protection, transparent fee structure (₹100 Doctor Fee + ₹20 Booking Fee), real-time doctor availability in `Asia/Kolkata` timezone, administrative and staff queue desks, and an AI clinical concierge powered by Google Gemini.

---

## 🏛 Unified Multi-Platform Deployment Architecture

The codebase uses a single canonical architecture compatible with **Google AI Studio / Cloud Run**, **GitHub**, and **Vercel** with zero duplicate code or platform lock-in:

```
                 ┌───────────────────────────┐
                 │     GOOGLE AI STUDIO      │
                 │        BUILD MODE         │
                 └─────────────┬─────────────┘
                               │
                               │ git push / sync
                               ▼
                 ┌───────────────────────────┐
                 │          GITHUB           │
                 │      CANONICAL REPO       │
                 └─────────────┬─────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
       ┌───────────────────┐       ┌───────────────────────┐
       │      VERCEL       │       │   GOOGLE AI STUDIO    │
       │ (Serverless API + │       │   (Cloud Run Container│
       │    Vite SPA)      │       │     Express Full)     │
       └─────────┬─────────┘       └───────────┬───────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    SUPABASE     │
                       │ (External DB &  │
                       │     Auth)       │
                       └─────────────────┘
```

---

## 🛠 Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Backend / API:** Node.js, Express, tsx
- **Build System:** Vite 8
- **AI Intelligence:** `@google/genai` TypeScript SDK (Server-Side Proxy)
- **Database & Auth (Optional):** `@supabase/supabase-js` (supports both in-memory local state and external PostgreSQL sync)
- **Payment Verification:** Razorpay HMAC SHA-256 server-side signature verification

---

## 🚀 Deployment Instructions

### A. Google AI Studio (Build & Publish / Cloud Run)

1. **Development:** In AI Studio Build mode, the development server runs via `tsx server.ts` mounted on port 3000 with hot-reloading.
2. **Publishing:** Click the **Publish / Deploy** button in Google AI Studio.
   - AI Studio builds the production client (`npm run build` → `dist/`).
   - Starts the production container using `npm start` (`tsx server.ts`), which automatically binds to `process.env.PORT` and serves both static assets and `/api/*` endpoints.

---

### B. GitHub Repository Setup

1. Initialize git (if starting fresh):
   ```bash
   git init
   git add .
   git commit -m "feat: production ready aesthetic dental clinic platform"
   git remote add origin https://github.com/<your-username>/aesthetic-dental-clinic.git
   git push -u origin main
   ```
2. The `.gitignore` prevents private keys, `.env`, `node_modules`, and `dist` from being committed.

---

### C. Vercel Deployment (Direct GitHub Import)

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository (`aesthetic-dental-clinic`).
3. Vercel automatically detects the Vite framework settings:
   - **Build Command:** `npm run build` (or `vite build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add your Environment Variables in the Vercel Project Settings (see below).
5. Click **Deploy**. Vercel will deploy the client SPA and route `/api/*` requests to the Serverless function in `api/index.ts` via `vercel.json`.

---

### D. Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORT` | Server | HTTP port for standalone container (defaults to `3000` or Cloud Run assigned port) |
| `NODE_ENV` | Server | `development` or `production` |
| `GEMINI_API_KEY` | Server | Google AI Studio Gemini API key (auto-injected in AI Studio, add in Vercel secrets) |
| `RAZORPAY_KEY_ID` | Server/Public | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Server | Razorpay Secret Key for HMAC verification |
| `RAZORPAY_WEBHOOK_SECRET`| Server | Razorpay Webhook signing secret |
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_ANON_KEY` | Server | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY`| Server | Supabase service-role key (server-only) |
| `VITE_SUPABASE_URL` | Client | Browser-accessible Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Browser-accessible Supabase anonymous key |

---

## 🩺 Health & Diagnostic Check

A public, non-sensitive health check is exposed at:

```http
GET /api/health
```

**Sample Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T11:40:00.000Z",
  "service": "Aesthetic Dental Clinic API",
  "environment": "production"
}
```
