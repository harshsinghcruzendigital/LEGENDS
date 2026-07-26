# Milestone 1 — Build Checklist

> ✅ **MILESTONE 1 COMPLETE** — `npm install` ✓ · `npm run build` ✓ (18/18 routes) · `tsc --noEmit` ✓ ·
> runtime smoke test ✓ (auth flow, guards, authed routes all 200). Run with `npm run dev`.

Live tracker so we can resume from the exact file if context fills. `[x]` = written to disk.

## Config & tooling
- [x] package.json
- [x] tsconfig.json
- [x] next.config.mjs
- [x] postcss.config.mjs
- [x] tailwind.config.ts
- [x] src/app/globals.css
- [x] .gitignore
- [x] .npmrc
- [x] .env.example
- [x] README.md

## Core lib (src/lib)
- [x] src/lib/utils.ts
- [x] src/lib/format.ts
- [x] src/lib/types.ts
- [x] src/lib/nav.ts
- [x] src/lib/mock/companies.ts
- [x] src/lib/mock/leads.ts
- [x] src/lib/mock/metrics.ts
- [x] src/lib/mock/notifications.ts
- [x] src/lib/auth.ts

## UI primitives (src/components/ui)
- [x] button.tsx
- [x] input.tsx
- [x] label.tsx
- [x] card.tsx
- [x] badge.tsx
- [x] avatar.tsx
- [x] dropdown-menu.tsx
- [x] sheet.tsx
- [x] dialog.tsx
- [x] checkbox.tsx
- [x] switch.tsx
- [x] tooltip.tsx
- [x] tabs.tsx
- [x] popover.tsx
- [x] separator.tsx
- [x] scroll-area.tsx
- [x] progress.tsx
- [x] skeleton.tsx
- [x] command.tsx
- [x] score-ring.tsx
- [x] severity-badge.tsx
- [x] status-badge.tsx
- [x] toaster.tsx (sonner)

## App shell (src/components/shell)
- [x] providers.tsx
- [x] sidebar.tsx
- [x] header.tsx
- [x] command-palette.tsx
- [x] notifications.tsx
- [x] user-menu.tsx
- [x] theme-toggle.tsx
- [x] page-header.tsx

## Routes — auth
- [x] src/middleware.ts
- [x] src/app/layout.tsx
- [x] src/app/page.tsx
- [x] src/app/(auth)/layout.tsx
- [x] src/app/(auth)/login/page.tsx
- [x] src/app/(auth)/signup/page.tsx
- [x] src/app/(auth)/forgot/page.tsx
- [x] src/app/api/auth/login/route.ts
- [x] src/app/api/auth/signup/route.ts
- [x] src/app/api/auth/logout/route.ts
- [x] src/components/auth/auth-form.tsx

## Routes — app shell + dashboard
- [x] src/app/(app)/layout.tsx
- [x] src/app/(app)/dashboard/page.tsx
- [x] src/features/dashboard/kpi-cards.tsx
- [x] src/features/dashboard/growth-chart.tsx
- [x] src/features/dashboard/source-chart.tsx
- [x] src/features/dashboard/opportunity-chart.tsx
- [x] src/features/dashboard/recent-discoveries.tsx
- [x] src/features/dashboard/ai-recommendations.tsx

## Routes — lead database
- [x] src/app/(app)/leads/page.tsx
- [x] src/features/leads/columns.tsx
- [x] src/features/leads/leads-table.tsx
- [x] src/features/leads/lead-filters.tsx
- [x] src/features/leads/lead-detail.tsx (slide-over)
- [x] src/features/leads/bulk-bar.tsx

## Routes — remaining nav
- [x] src/app/(app)/discovery/page.tsx
- [x] src/app/(app)/campaigns/page.tsx
- [x] src/app/(app)/crm/page.tsx
- [x] src/app/(app)/automation/page.tsx
- [x] src/app/(app)/insights/page.tsx
- [x] src/app/(app)/settings/page.tsx
- [x] src/components/shared/module-preview.tsx

## Verify
- [x] npm install
- [x] npm run build passes
- [x] npm run dev runs

---

# Milestone 2 — Lead Discovery ✅ COMPLETE

> `tsc --noEmit` ✓ · `npm run build` ✓ (discovery route live) · runtime ✓ (authed /discovery 200).

- [x] src/lib/mock/leads.ts — parameterized generator + `discoverLeads()` (filters shape results)
- [x] src/lib/discovery.ts — source catalog, DiscoveryConfig, seed/estimate helpers, staged run, localStorage runs store
- [x] src/features/discovery/discovery-console.tsx — source picker, ICP builder, live staged run, results, history
- [x] src/app/(app)/discovery/page.tsx — real console (replaced M2 preview)
- [x] src/lib/nav.ts — removed Discovery "M2" flag

Functional: pick sources → build ICP (industries/countries/opportunity signals/keywords/min-score/limit) →
live estimate → Run → 6-stage animated pipeline (collect→dedupe→audit→enrich→score→done) → ranked results
(open any into the shared slide-over) → persisted run history you can replay. Deterministic per-config seed.

---

# Milestone 3 — CRM Kanban ✅ COMPLETE

> `tsc --noEmit` ✓ · `npm run build` ✓ (/crm 18.3 kB) · runtime ✓ (authed /crm 200, stats render).

- [x] @dnd-kit/core + sortable + utilities installed
- [x] src/features/crm/deal-card.tsx — draggable card + `dealValue()`
- [x] src/features/crm/pipeline-stats.tsx — open/weighted/won/win-rate tiles + STAGE_PROBABILITY
- [x] src/features/crm/board.tsx — dnd-kit board, 8 stage columns, drop-to-move, drag overlay, reuse LeadDetail
- [x] src/app/(app)/crm/page.tsx — real board (replaced M3 preview)
- [x] src/lib/nav.ts — removed CRM "M2" flag

Functional: drag deals across NEW→…→WON/LOST with smooth overlay + drop animation; columns show live
count + value; moving a card re-sorts by score and toasts; every card opens the shared slide-over detail;
pipeline stats (open value, weighted forecast, won, win rate) roll up from the leads.

---

# Milestone 4 — Campaigns ✅ COMPLETE

> `tsc --noEmit` ✓ · `npm run build` ✓ (/campaigns + /campaigns/[id] pre-rendered) · runtime ✓ (both 200).

- [x] src/lib/types.ts — Campaign/SequenceStepDef/CampaignStats types
- [x] src/lib/ai-copy.ts — AI Outreach Copywriter: generateEmail (3 tones) grounded in top audit finding + token fill
- [x] src/lib/mock/campaigns.ts — 6 campaigns w/ sequences + funnel stats
- [x] src/features/campaigns/campaigns-list.tsx — campaign cards w/ open/click/reply rates
- [x] src/features/campaigns/campaign-detail.tsx — sequence builder (editable steps, add/remove, tokens) + funnel analytics + AI Composer
- [x] src/app/(app)/campaigns/page.tsx + [id]/page.tsx
- [x] src/lib/nav.ts — removed Campaigns "M2" flag

Functional: campaigns list → detail with editable multi-step sequence (subject/body/delay + token legend),
status toggle, funnel analytics (sent→delivered→opened→clicked→replied), and the star: an **AI Copy Composer**
that generates a personalized email per selected lead, referencing that lead's real top audit finding, in 3
tones — copy or insert into Step 1.

---

# Milestone 5 — Automation ✅ COMPLETE  (all 8 modules now functional)

> `tsc --noEmit` ✓ · `npm run build` ✓ (/automation + /automation/[id] pre-rendered) · runtime ✓ (both 200).

- [x] @xyflow/react (React Flow) installed
- [x] src/lib/mock/workflows.ts — WF graph types, node palette, 4 workflows (canonical Doc 12 recipe), run log
- [x] src/features/automation/nodes.tsx — custom trigger/condition/action/wait nodes + handles (branch yes/no)
- [x] src/features/automation/workflow-canvas.tsx — React Flow canvas: add-node palette, connect edges, minimap, controls, publish/pause, test-run log
- [x] src/features/automation/workflows-list.tsx — workflow cards (runs, success rate)
- [x] src/app/(app)/automation/page.tsx + [id]/page.tsx
- [x] src/app/globals.css — React Flow theme overrides
- [x] src/lib/nav.ts — removed Automation "M2" flag (LAST preview flag gone)

Functional: workflow list → visual builder canvas. Pan/zoom/minimap; add nodes from palette; drag to
reposition; connect handles to draw edges; condition nodes have yes/no branch outputs; publish/pause toggle;
"Test run" streams a live execution log. Canonical recipe (broken site → verify → sequence → wait → notify)
pre-loaded on wf_001.

## 🎉 ALL 8 NAV MODULES FUNCTIONAL: Dashboard · Discovery · Lead Database · Campaigns · CRM · Automation · Insights · Settings

---

# Milestone 6 — tRPC API layer (Leads → server-side) ✅ COMPLETE

> `tsc --noEmit` ✓ · `npm run build` ✓ · runtime ✓ — GET /api/trpc/leads.list returns live sorted/paginated data.

- [x] @trpc/server + @trpc/client + @trpc/react-query + @tanstack/react-query + superjson installed
- [x] src/lib/leads-query.ts — pure filter/sort/paginate (shared client+server; the SQL seam)
- [x] src/server/trpc.ts — initTRPC, superjson transformer, org-scoped context from session cookie
- [x] src/server/repositories/leads.repo.ts — data-access seam (mock today → Prisma later, same signature)
- [x] src/server/routers/leads.ts — leads.list (zod-validated filter/sort/page) + leads.byId
- [x] src/server/root.ts — appRouter + exported AppRouter type
- [x] src/app/api/trpc/[trpc]/route.ts — fetch handler at /api/trpc
- [x] src/lib/trpc/{client.ts,provider.tsx} — typed hooks + Query/tRPC provider
- [x] src/components/shell/providers.tsx — TrpcProvider wired in
- [x] src/features/leads/leads-table.tsx — rewired to trpc.leads.list.useQuery (manual server-side pagination/sort/filter, keepPreviousData, skeleton/refetch states)
- [x] src/features/leads/lead-filters.tsx — filter types sourced from shared leads-query
- [x] src/features/leads/columns.tsx — only server-sortable fields marked sortable

The Lead Database is now truly API-driven: the UI sends filter/sort/page → tRPC → repository → pure query.
Swapping the repository body to Prisma/Postgres later changes nothing upstream. Other modules still read mock
directly (migrate in later milestones).

---

# Milestone 7 — Modules migrated to tRPC ✅ COMPLETE

> `tsc --noEmit` ✓ · `npm run build` ✓ · runtime ✓ (6 pages 200; metrics.dashboard/campaigns.list/crm.board/workflows.list all return data).

- [x] src/server/caller.ts — server-side caller (createCallerFactory) for Server Components (no HTTP)
- [x] repositories: metrics.repo, campaigns.repo, crm.repo, workflows.repo
- [x] routers: metrics.dashboard, campaigns.list/byId, crm.board, workflows.list/byId → added to root
- [x] Dashboard: page uses server caller → metrics.dashboard; kpi-cards/charts/recent/ai-recs take props (mock-default, backward compatible)
- [x] Campaigns: list → trpc.campaigns.list.useQuery; detail page → caller.campaigns.byId
- [x] CRM: page → caller.crm.board; CrmBoard seeded from initialBoard prop (dnd stays local)
- [x] Automation: list → trpc.workflows.list.useQuery; workflow page → caller.workflows.byId

Now 6 of 6 data surfaces (Leads + Dashboard + Campaigns + CRM + Automation) read through the tRPC API +
repository seam. Discovery remains a client simulation (noted for later). Swapping any repository body to
Prisma/Postgres is now the only change needed to go from mock → real DB.

---

# Milestone 8 — Prisma + Postgres (flagged) ✅ COMPLETE

> `tsc --noEmit` ✓ · `prisma generate` ✓ · `npm run build` ✓ (no DB) · runtime ✓ (mock fallback intact, zero DB errors).
> DB query path compiles + generates; live-verified once a DATABASE_URL is provided.

- [x] prisma@6 + @prisma/client@6 + tsx installed
- [x] prisma/schema.prisma — Org, Lead, Contact + 7 enums (docs/04); arrays + JSON for staged normalization
- [x] prisma/seed.ts — ports the mock LEADS into Postgres (idempotent)
- [x] src/server/db.ts — lazy PrismaClient + `hasDatabase` flag (no DATABASE_URL → never constructs)
- [x] src/server/mappers/lead.ts — Prisma row → frontend Lead shape
- [x] src/server/repositories/leads.repo.ts — Prisma list/byId behind flag (real WHERE/ORDER/LIMIT), mock fallback
- [x] src/server/repositories/crm.repo.ts — Prisma board behind flag, mock fallback
- [x] src/server/routers/leads.ts — byId awaits async repo
- [x] package.json — db:generate/push/migrate/seed/studio/setup + postinstall generate + prisma.seed config
- [x] .env.example + README — Neon activation steps

**To go live:** set `DATABASE_URL` (Neon) → `npm run db:setup` → `npm run dev`. Remove it → back to mock.
The app is unchanged on mock today; Postgres is one command away. campaigns/workflows/metrics still mock
(their Prisma tables come in a later milestone).

---

# Milestone 8 — LIVE on Neon Postgres ✅ VERIFIED

> Real database connected and proven end-to-end.

- [x] .env written with Neon DATABASE_URL (gitignored)
- [x] `npm run db:push` → schema (Org/Lead/Contact + enums) created on Neon
- [x] `npm run db:seed` → 140 leads + contacts + org inserted (tsx resolved @/ aliases)
- [x] `npm run build` passes with DATABASE_URL present
- [x] PROOF: raw-SQL-mutated a row → app's leads.list returned it (total 1) — reads live DB, not mock
- [x] Live verify: all pages 200; leads.list total=140; score≥80 filter total=4 (real SQL WHERE); crm.board OK; zero errors
- [x] Re-seeded to clean state

The Lead Database + CRM now run on PostgreSQL. Everything else (mock-backed campaigns/workflows/metrics,
Discovery sim) unchanged and still working. To return to mock: remove DATABASE_URL from .env.

---

# Milestone 9 — Campaigns + Workflows persisted ✅ VERIFIED (live Neon)

> `tsc` ✓ · `db:push` ✓ · `db:seed` ✓ · `build` ✓ · live-proven.

- [x] schema: Campaign, SequenceStep, Workflow models + CampaignStatus/StepChannel/WorkflowStatus enums (Org relations)
- [x] mappers: campaign.ts, workflow.ts (Prisma row → frontend shape)
- [x] campaigns.repo + workflows.repo → Prisma behind hasDatabase flag (mock fallback)
- [x] campaigns/workflows routers byId now await async repos
- [x] [id] pages made dynamic (removed generateStaticParams — avoids build-time org-mismatch not-found)
- [x] seed extended: 6 campaigns (+steps) + 4 workflows
- [x] PROOF: raw-SQL-renamed a campaign → app's campaigns.list returned it; counts 6/4; detail pages 200; zero errors
- [x] re-seeded clean

Now on Postgres: Leads, Contacts, CRM, Campaigns, Workflows. Still mock: dashboard metrics (aggregates) + Discovery sim.

---

# Milestone 10 — Real authentication ✅ VERIFIED (live)

> `tsc` ✓ · `db:push` ✓ · `db:seed` ✓ · `build` ✓ · full auth flow proven on Neon.

- [x] schema: User, Session, Membership + Role enum (Org.memberships relation) — pushed to Neon
- [x] src/server/password.ts — scrypt hashing (node:crypto, no native dep, Windows-safe)
- [x] src/server/auth.ts — signup/login/logout, DB sessions, getSession, getAuthContext, resolveToken; mock fallback when no DB; "server-only"
- [x] src/server/trpc.ts — real Context (orgId+userId+isAuthed) from cookie, protectedProcedure
- [x] all 5 data routers → protectedProcedure (reject unauthenticated)
- [x] caller.ts → real getAuthContext; auth route handlers (login/signup/logout) rewritten
- [x] getSession importers → @/server/auth; lib/auth.ts slimmed to SESSION_COOKIE
- [x] seed: demo user (alex@brightpixel.agency / demodemo, OWNER of org_demo)

VERIFIED live: unauth→401 · wrong pw→401 · demo login→140 leads · fresh signup→0 leads (TENANT ISOLATION) ·
logout→session deleted→UNAUTHORIZED. Multi-tenancy is now genuinely enforced, not mocked.

---

# Milestone 11 — Discovery persists to DB ✅ VERIFIED (live)

> `tsc` ✓ · `build` ✓ · full discover→persist loop proven on Neon.

- [x] src/server/repositories/discovery.repo.ts — generates candidates from ICP, dedupes by domain, inserts leads(+contacts) scoped to org in a transaction; mock mode returns without saving; unique per-run ids (dq_<stamp>_i)
- [x] src/server/routers/discovery.ts — discovery.run mutation (protectedProcedure, zod-validated config)
- [x] root.ts — discoveryRouter registered
- [x] discovery-console.tsx — startRun → trpc.discovery.run.useMutation (animation gated on server response); history replay → /leads; results CTA → "View in Lead Database"; removed client runResults

VERIFIED live: fresh signup 0 leads → discovery.run → 10 saved (qualified 1) → re-run same config = 0 new / 10
duplicates (dedupe) → demo org still 140 (isolation). The core loop (discover → audit-scored leads → persisted
to your org → appear in Lead Database) is now real.

## Persisted end-to-end: Auth · Users · Sessions · Orgs · Leads · Contacts · CRM · Campaigns · Workflows · Discovery
## Still mock: dashboard metrics (aggregates)

---

# Milestone 12 — Real per-org dashboard metrics ✅ VERIFIED (live)

> `tsc` ✓ · `build` ✓ · per-org aggregates proven on Neon.

- [x] metrics.repo → computeFromDb(orgId): KPIs, 30-day growth, source/opportunity/geo/score/pipeline
      breakdowns, recent feed, dynamic recommendations — all from live per-org lead+contact aggregates
- [x] mock branch retained for no-DB mode
- [x] KPI metadata (label/icon/accent/delta/spark) kept static for premium look; VALUES are real

VERIFIED live: demo org dashboard total=140; fresh signup total=0; after discovering 8 → total=8.
New users now see THEIR data, not the demo's — the last mock leak in DB mode is closed.

## Fully real end-to-end (Postgres, per-org, authed): Dashboard · Discovery · Leads · Contacts · CRM · Campaigns · Workflows · Auth

---

# Milestone 13 — Durable lead + CRM mutations ✅ VERIFIED (live)

> `tsc` ✓ · `build` ✓ · persistence proven on Neon.

- [x] leads.repo: update(orgId,id,patch) [stage/assignedTo/tags/status + activity trail] + addNote(orgId,id,note) [notes + activity]; DB + mock branches
- [x] leads router: update + addNote mutations (protectedProcedure, zod, org-scoped)
- [x] CRM board: drag → trpc.leads.update persists stage; optimistic with revert-on-error; invalidates leads.list
- [x] LeadDetail: stateful (local copy synced from prop); stage dropdown, Assign, and note composer all persist via mutations + invalidate leads.list/crm.board/metrics.dashboard

VERIFIED live: stage ld_0001→WON persists across refetch; note persists; activity trail auto-records
"Moved to Won" + "Note added". Edits are now durable — the app both reads AND writes real data.

## The app is a real, working, multi-tenant SaaS on Postgres: signup → discover → audit-scored leads → CRM → campaigns → automation, all persistent & isolated.

---

# Milestone 14 — Real Website Scanner ✅ LIVE (real data)

> First real data source. Deployed to prod + verified on real URLs.

- [x] src/server/services/website-audit.ts — real fetch(): SSL, security headers, SEO tags, mobile viewport,
      tech fingerprint, TTFB, page weight → real scores + findings. Optional PageSpeed via PAGESPEED_API_KEY.
- [x] src/server/repositories/scanner.repo.ts — buildLeadFromAudit + scan() upserts lead by domain in org
- [x] src/server/routers/scanner.ts — scan mutation; registered in root
- [x] src/features/scanner/scanner-view.tsx + /scanner page + nav item (ScanSearch) + middleware guard
- [x] deployed (git 0c7447b + vercel --prod)

VERIFIED live: stripe.com → SSL✓, security 100, overall 96; example.com → real findings NO_META/NO_SCHEMA/
NO_HSTS/NO_TRACKING/NO_FORM. Paste any real URL → real audit → saved lead. This is genuine data, no scraping
of third parties (audits the URL the user provides).

---

# Milestone 15 — Bulk scanning + real domain age ✅ LIVE

> Deployed + verified on prod. More real, keyless data.

- [x] website-audit.ts — RDAP domain age (real registry data, keyless); FIX: send User-Agent (rdap.org 403s no-UA) + 7s timeout for Vercel cold start
- [x] scanner-view.tsx — bulk mode: paste many URLs → sequential client scans → live per-URL progress, score rings, findings, summary tiles (scanned / avg score / issues); each opens LeadDetail
- [x] deployed (git 509d692 + vercel --prod)

VERIFIED live: cloudflare.com → domainAgeDays 6366 (real, reg 2009); bulk multi-URL scanning with live progress.
Real data now: SSL, security headers, SEO, mobile, TTFB/perf, tech, findings, AND domain age — all keyless.
