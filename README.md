# Lead Gen Engine — Web App (Milestone 1)

Premium, AI-native lead-generation platform. This repo currently contains the **architecture docs**
(`/docs`) and **Milestone 1**: a fully runnable Next.js web application with premium glassmorphism UI,
mock authentication, a global dashboard, and an advanced Lead Database — all driven by realistic mock data.

> Implemented strictly against `/docs` (Information Architecture, Database Schema, Design System, Frontend
> Architecture). See `CHECKLIST.md` for the M1 file-by-file build status.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 → you'll land on the login screen.

**Demo login:** any email + any password (≥6 chars) signs you in — M1 uses a mock cookie session.
Or click **"Use demo account"**.

## What's in Milestone 1

- **Auth** — login / signup / forgot-password, cookie-based session, route-guard middleware.
- **App shell** — collapsible sidebar (full nav from Doc 02), header with global search, ⌘K command
  palette, notifications panel, user menu, dark/light theme toggle.
- **Dashboard** — 12 KPI tiles, growth/source/opportunity charts, geo + score distribution, recent
  discoveries feed, AI recommendations.
- **Lead Database** — TanStack-powered table with search, multi-filter, sorting, pagination, bulk
  selection, column visibility, and a slide-over Lead Detail panel (overview, audit scores, contacts,
  notes, timeline).
- **Module previews** — Discovery, Campaigns, CRM, Automation, Insights, Settings pages (Insights &
  Settings are functional; the rest are clearly-marked previews landing in Milestone 2).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · TailwindCSS · shadcn-style components on Radix ·
Framer Motion · TanStack Table · Recharts · cmdk · next-themes.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next lint |

## Notes

- No environment variables are required for M1 (see `.env.example`).
- Milestone 1 is a standalone Next.js app at the repo root for one-command runnability. When the NestJS API
  arrives (later milestone), it migrates into `apps/web` per `docs/07-folder-structure.md`.

## Database (optional — Milestone 8)

The app runs on **mock data by default** (no setup). To back the Lead Database + CRM with a real
**PostgreSQL** database via Prisma:

1. Create a free Postgres at **[neon.tech](https://neon.tech)** and copy the connection string.
2. Add it to `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/leadgen?sslmode=require"
   ```
3. Push the schema + seed the data, then run:
   ```bash
   npm run db:setup     # prisma db push + seed (ports the mock dataset into Postgres)
   npm run dev
   ```

That's it — the `leads` and `crm` repositories detect `DATABASE_URL` and switch from mock to Prisma
automatically (`src/server/db.ts`). Remove the variable to fall back to mock. Other DB scripts:
`npm run db:studio` (browse data), `npm run db:migrate` (versioned migrations), `npm run db:generate`.
