# SUS-Flow

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Live queue dashboard and AI-assisted triage portal for Brazilian public healthcare (SUS), implementing the Manchester Triage Protocol.

[Live Demo](https://sus-flow.vercel.app)

---

## What it is

SUS-Flow makes Brazilian public healthcare wait times visible to citizens through a real-time queue dashboard, while providing nurses with an AI-assisted triage form implementing the Manchester Triage Protocol. Citizens can see live queue depths and estimated wait times by priority without logging in. Nurses access a protected portal where structured vital signs and chief complaints are classified by a hybrid rule engine + Google Gemini AI, with full audit trail.

> **⚠️ Synthetic data:** All patient data shown in the application is entirely synthetic. No real patient data is used or stored. This project is not a medical device.

---

## Tech stack

- **Framework:** Next.js 14 App Router (TypeScript)
- **Database:** Neon PostgreSQL + Prisma 6 (pooled + direct URLs)
- **Real-time:** Server-Sent Events (Node.js runtime)
- **UI:** shadcn/ui + Tailwind CSS + Framer Motion
- **Forms:** React Hook Form + Zod
- **AI:** Vercel AI SDK v6 + Google Gemini (free tier via `@ai-sdk/google`)
- **Auth:** iron-session (demo mode — one-click nurse login)
- **Charts:** Recharts
- **Deploy:** Vercel
- **Tests:** Vitest

---

## Getting started

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/sus-flow.git
cd sus-flow

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables section)

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed initial data
npx prisma db seed

# 6. Start development server
npm run dev
```

Open http://localhost:3000 to see the public dashboard. Navigate to /login to access the nurse portal.

---

## Environment variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `DATABASE_URL` | Neon pooled connection URL (port 6543, Supavisor) — used at runtime | [Neon Console](https://console.neon.tech) → Connection Details → Pooled connection |
| `DIRECT_URL` | Neon direct connection URL (port 5432) — used by `prisma migrate dev` only | [Neon Console](https://console.neon.tech) → Connection Details → Direct connection |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key for Gemini (free tier available) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `CRON_SECRET` | Random secret verified as `Authorization: Bearer` header on `/api/cron/simulate` | Generate with `openssl rand -hex 32` |
| `IRON_SESSION_SECRET` | 32+ character random string for iron-session cookie encryption | Generate with `openssl rand -hex 32` |

---

## Deploy to Vercel

1. Fork this repository on GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your fork
3. In the Environment Variables section, add all 5 variables from the table above
4. Click Deploy — Vercel auto-detects Next.js and builds the project
5. After deployment, update the `DATABASE_URL` with your Neon pooled URL and trigger a redeploy

> **Note:** The simulation cron job runs hourly on Vercel's Hobby plan (`vercel.json` schedule). For more frequent simulation (every minute), upgrade to Vercel Pro.

Live deployment: https://sus-flow.vercel.app *(update this URL after your first deploy)*

---

## Architecture notes

### SSE + QueueMetrics decoupling

The public dashboard receives live updates via Server-Sent Events. Rather than running live aggregation queries on every SSE poll, a Vercel Cron job writes pre-computed `QueueMetrics` rows to the database each invocation. The SSE handler reads those rows directly — N concurrent dashboard clients never trigger N heavy queries.

### Hybrid AI classifier

Triage submissions go through a two-stage pipeline. A deterministic rule engine evaluates structured vital signs and Manchester discriminator weights in ~1ms without any network call. Google Gemini is invoked only when rule confidence falls below 0.80 or free-text symptoms are present. The AI result is always advisory — the nurse must explicitly confirm or override before the record is saved.

### Demo auth pattern

The nurse portal uses iron-session for cookie-based session management. A one-click "Entrar como Enfermeiro(a) — Demo" button creates a session without email or password — designed for portfolio demonstration. Next.js middleware checks for session cookie presence (no database call) to protect all `/triage/*` routes.

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
