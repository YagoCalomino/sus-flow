# SUS-Flow

Real-time queue dashboard for Brazilian public healthcare (SUS), with Manchester Protocol triage. Built around a **pre-aggregation pattern**: a scheduled job computes `QueueMetrics` snapshots in PostgreSQL, so N concurrent dashboard clients read precomputed rows over SSE instead of triggering N aggregation queries.

[Live demo](https://sus-flow.vercel.app) · Synthetic data only, not a medical device.

## Data flow

Triage events (Prisma/PostgreSQL) → scheduled aggregation (Vercel Cron) → `QueueMetrics` snapshot table → SSE stream → dashboard

---

## Getting started

```bash
# 1. Clone
git clone https://github.com/YagoCalomino/sus-flow.git
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

> Developed in a private repository and published here with a clean history. Development continues in this repo.
