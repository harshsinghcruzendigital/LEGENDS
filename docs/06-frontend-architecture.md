# 06 — Frontend Architecture

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · shadcn/ui · Framer Motion · TanStack Query/Table · tRPC client.

## 1. Rendering strategy

- **Server Components by default** for shell, nav, and read-heavy pages (dashboard KPIs, lead detail) — data fetched server-side via tRPC server caller, streamed with Suspense.
- **Client Components** only where interactivity demands it: the data grid, Kanban DnD, workflow canvas, sequence builder, command palette, charts, live progress.
- **Route Handlers** for webhooks, OAuth callbacks, tracking pixels, export downloads, and the public report OG image.
- **Partial Prerendering** for the marketing + public report routes (fast, cacheable shell).

## 2. App Router structure (route groups)

```
app/
  (marketing)/                 # public, prerendered
    page.tsx  pricing/  ...
  (auth)/
    login/  signup/  forgot/  invite/[token]/
  r/[publicId]/                # public shareable audit report (no auth)
  (app)/                       # authenticated shell — layout enforces session+org
    layout.tsx                 # sidebar + topbar + command palette + assistant slot
    dashboard/
    discovery/  discovery/runs/[id]/
    maps/  marketplace/  apps/  scanner/  chrome/
    leads/  leads/[id]/
    enrichment/  verification/
    crm/  crm/board/  crm/deals/[id]/  crm/calendar/
    campaigns/  campaigns/[id]/  inbox/
    automation/  automation/[id]/
    insights/  assistant/
    integrations/
    settings/(profile|organization|team|billing|api-keys|mailboxes|notifications|audit-log)/
  (admin)/admin/...            # staff-only, separate guard
  api/                         # route handlers (webhooks, oauth, tracking, export)
```

## 3. State model (deliberately layered)

| Concern | Tool | Notes |
|---|---|---|
| Server data | **TanStack Query via tRPC** | Source of truth for anything from the API; cache keys per org |
| URL/view state | **`nuqs` (URL search params)** | Filters, sort, page, active tab — shareable, back-button-correct |
| Ephemeral UI | **Zustand** (tiny stores) | Slide-over open state, command palette, selection sets, DnD drafts |
| Forms | **react-hook-form + zod** | Same zod schemas shared with the API DTOs (single source of truth) |
| Theme | **next-themes** | dark/light/system; tokens in Doc 13 |
| Realtime | **SSE / WebSocket** | Discovery progress, live discoveries feed, campaign events |

No global Redux. Server state stays in Query; local state stays local. Filters live in the URL so a saved
view is literally a serialized URL + a `SavedView` row.

## 4. The data grid (Lead Database) — the hardest UI

- **TanStack Table** headless + **TanStack Virtual** for row virtualization (100k rows smooth).
- **Server-side** sort/filter/search/pagination — the client sends the Filter DSL (Doc 04 §11); the server compiles it.
- Column definitions are data-driven (visibility, order, pinning persisted per user).
- Multi-select with a persistent **bulk-action bar**; selection survives pagination via id-set + "select all matching filter" (server resolves the set for bulk jobs).
- Row → **slide-over** (`leads/[id]` intercepting route `@modal`) so the URL is deep-linkable but the table stays mounted.

## 5. Intercepting routes for slide-overs

Lead/Deal detail uses parallel + intercepting routes: clicking a row opens `/app/leads/[id]` as an overlay
(table preserved); a hard navigation/refresh renders the full page. Same component, two entries. This is the
"never lose context" pattern from Doc 02 §4.

## 6. Data fetching patterns

- Server Components call the **tRPC server caller** directly (no HTTP round-trip) for initial paint.
- Client mutations use tRPC React hooks with **optimistic updates** + `onError` rollback (stage moves, assign, tag).
- **Streaming**: discovery progress and live feeds via SSE route handler → a `useDiscoveryStream` hook updating Query cache.
- **Prefetch on intent**: hovering a lead row prefetches its detail; hovering a nav item prefetches the route.

## 7. Design system integration

- **shadcn/ui** as the primitive layer (Radix under the hood → accessibility for free).
- A `@leadgen/ui` package wraps shadcn with our tokens + glass variants (Doc 13): `<GlassCard>`, `<StatTile>`, `<ScoreRing>`, `<SeverityBadge>`, `<DataGrid>`, `<KpiRow>`, `<Sparkline>`.
- **Framer Motion** for: page transitions, slide-overs, KPI count-ups, Kanban drag, chart reveals — all respecting `prefers-reduced-motion`.
- Charts: **Recharts** for standard viz; the `dataviz` skill's palette + accessibility rules apply (never color as the only signal; light+dark aware).

## 8. Performance budget

- Route-level code splitting; heavy client islands (canvas, grid, charts) lazy-loaded.
- Images via `next/image`; screenshots served from object storage with responsive sizes.
- Target: LCP < 2.0s on dashboard, INP < 200ms on grid interactions, JS < 200KB gzip for the shell.
- We **eat our own dog food** — the app must pass the same Core Web Vitals we shame prospects for.

## 9. Accessibility & i18n

- WCAG 2.2 AA: focus management on slide-overs/modals, keyboard-navigable grid + Kanban, ARIA on custom widgets.
- Command palette and full keyboard shortcuts (`g d` dashboard, `g l` leads, `⌘K` palette, `⌘Enter` run).
- i18n-ready (next-intl) with string extraction from day one; ship en-US first.

## 10. Error, empty & loading states (first-class, not afterthoughts)

- Every async surface has: skeleton (loading), teaching empty state (Doc 02 §4), and a recoverable error with retry.
- Global error boundary + per-island boundaries so one failed chart never blanks the dashboard.
- Toasts for mutation feedback; a persistent "jobs" indicator for long-running discovery/audit runs.
