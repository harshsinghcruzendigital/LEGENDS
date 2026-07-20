# 08 — API Specification

Two surfaces:
1. **tRPC** — the primary, typed API the Next.js app consumes (no OpenAPI drift; types flow end-to-end).
2. **REST** — for webhooks, OAuth callbacks, the Chrome extension, tracking pixels, exports, and third-party/public API tokens.

## 1. Conventions

- **Base:** tRPC at `/trpc`; REST at `/api/v1`.
- **Auth:** session cookie (web) or `Authorization: Bearer <platform_token>` (REST/API).
- **Tenant:** active org from session or `X-Org-Id` header (validated against membership).
- **Errors:** normalized envelope `{ code, message, details? }`; tRPC error codes map to HTTP (UNAUTHORIZED→401, FORBIDDEN→403, NOT_FOUND→404, TOO_MANY_REQUESTS→429, BAD_REQUEST→400).
- **Pagination:** cursor-based — `{ items, nextCursor }`, `input: { cursor?, limit(≤100), filter?, sort? }`.
- **Idempotency:** `Idempotency-Key` header honored on all mutating REST endpoints.
- **Rate limits:** per-token + per-org sliding window (Redis); `429` with `Retry-After`.
- **Validation:** every input is a shared zod schema from `packages/schemas`.

## 2. tRPC router tree (`AppRouter`)

```ts
appRouter = router({
  auth:        { signup, login, logout, me, acceptInvite },
  org:         { get, update, branding, members, invite, removeMember, changeRole, teams },
  user:        { profile, updateProfile, notificationPrefs },

  metrics:     { dashboard, timeseries, geoHeatmap, scoreHistogram, recommendations },

  discovery: router({
    estimate,                 // (filters, sources) → predicted result count + credit cost
    run,                      // (icpId? | {filters,sources,schedule?}) → DiscoveryRun
    runs: { list, get, cancel, retry },
    icp:  { list, create, update, delete, duplicate },
    maps:        { search },          // Places/OSM
    marketplace: { search, resolveBrand },
  }),

  audit: router({
    website: { run, get, bulk, reaudit, publicReport },   // publicReport → /r/:publicId
    ui:      { run, get },
    app:     { search, run, get },
  }),

  leads: router({
    list,                     // Filter DSL + sort + cursor  (server-compiled)
    get, update, bulkUpdate, delete, restore,
    assign, tag, changeStage,
    contacts: { list, add, update, remove, setPrimary },
    savedViews: { list, create, update, delete },
    export,                   // → async job → signed CSV link
    selectAllMatching,        // resolve id-set for a filter (for bulk ops)
  }),

  enrichment:  { run, bulk, status, providers, provenance },
  verify:      { email, bulk, status, suppression: { list, add, remove } },
  scoring:     { rescore, rubric: { get, update }, explain },   // explain(leadId) → factor breakdown

  crm: router({
    deals:   { list, get, create, update, changeStage, delete, board },
    tasks:   { list, create, update, complete, delete },
    meetings:{ list, create, update, delete },
    notes:   { list, create, delete },
    activity:{ list },        // per lead/deal timeline
  }),

  campaigns: router({
    list, get, create, update, pause, resume, delete,
    sequences: { get, upsertSteps, aiDraftStep },   // aiDraftStep → AI Gateway
    enroll, unenroll, enrollFromFilter,
    analytics,                // funnel + per-step + per-variant
    inbox: { threads, reply, markSentiment },
  }),

  mailboxes:   { list, connectOAuthUrl, callback, disconnect, testSend, warmupStatus },

  workflows: router({
    list, get, create, update, publish, pause, delete,
    runs: { list, get, retry },
    triggers, actions,        // registries for the builder palette
  }),

  integrations:{ catalog, list, connect, disconnect, config, events, testConnection },

  assistant:   { chat, tools, threads },     // streaming; NL→Filter DSL; tool-use with confirm

  insights:    { trends, opportunityHeatmap, cohorts, suggestedIcps },

  billing:     { subscription, usage, plans, checkout, portal, invoices },
  usage:       { current, limits, history },

  admin: router({                            // requires isStaff
    orgs: { list, get, suspend, impersonateStart, impersonateEnd },
    providers: { health, spend },
    queues: { overview, job, retry, drain },
    flags: { list, set },
    audit: { list },
  }),
})
```

## 3. Representative endpoint contracts

### `discovery.run`
```ts
input: {
  icpId?: string
  filters?: FilterTree            // Doc 04 §11
  sources: SourceId[]             // ["google_places","serp","play_store",...]
  schedule?: string | null        // cron or null
  limit?: number                  // max candidates this run (plan-capped)
}
→ { runId: string, status: "QUEUED", estimatedCredits: number }
// side effects: creates DiscoveryRun, enqueues per-source jobs, emits usage guard check
// errors: FORBIDDEN (no discovery permission), TOO_MANY_REQUESTS (quota), BAD_REQUEST (invalid filter field)
```

### `leads.list`
```ts
input: {
  filter?: FilterTree
  search?: string                 // FTS over company/domain/city
  sort?: { field: LeadSortField, dir: "asc"|"desc" }
  cursor?: string
  limit?: number                  // ≤100
  view?: string                   // savedViewId shortcut
}
→ { items: LeadRow[], nextCursor?: string, total?: number }
// LeadRow = the denormalized grid projection (scores, stage, primary contact, screenshot)
```

### `audit.website.run`
```ts
input: { url: string, leadId?: string, includeUi?: boolean }
→ { auditId: string, status: "PENDING" }   // async; poll audit.website.get or subscribe
// worker → Python render svc → WebsiteAudit + findings; optional UI-vision pass
```

### `verify.email`
```ts
input: { email: string }
→ { status: "VALID"|"RISKY"|"INVALID"|"UNKNOWN", confidence: number,
    checks: { syntaxOk, mxFound, smtpOk, isCatchAll, isDisposable, isRole } }
```

### `assistant.chat` (streaming)
```ts
input: { threadId?: string, message: string }
→ SSE stream of { type:"token"|"tool_call"|"tool_result"|"confirm_required"|"done", ... }
// writes require an explicit confirm frame the client must approve before execution
```

## 4. REST endpoints (non-tRPC)

```
POST   /api/v1/webhooks/stripe               Stripe events (signature-verified)
POST   /api/v1/webhooks/email/:provider      Inbound reply/bounce/complaint from ESP
GET    /api/v1/oauth/:provider/callback      Gmail/Outlook/HubSpot/… OAuth
GET    /api/v1/track/open/:token.gif         Open pixel (1x1)
GET    /api/v1/track/click/:token            Click redirect
POST   /api/v1/capture                       Chrome extension → create Candidate (Bearer token)
GET    /api/v1/export/:jobId                 Signed CSV download
POST   /api/v1/hooks/zapier/:orgToken        Inbound Zapier trigger
GET    /api/v1/public/report/:publicId       Public audit report data (for /r/:publicId)

# Public developer API (Bearer platform_token, scoped + rate-limited)
GET    /api/v1/leads            POST /api/v1/leads/search
GET    /api/v1/leads/:id
POST   /api/v1/discovery/run
POST   /api/v1/audit/website
POST   /api/v1/verify/email
GET    /api/v1/usage
```

## 5. Realtime channels

| Channel | Transport | Payload |
|---|---|---|
| `discovery:run:{id}` | SSE | stage progress, counts |
| `leads:feed` | SSE | new lead promoted (live discoveries) |
| `campaign:{id}:events` | SSE | opens/clicks/replies |
| `assistant:{threadId}` | SSE | streamed tokens + tool frames |
| `jobs:{orgId}` | WebSocket | global long-job status indicator |

## 6. Security posture on the API

- All tenant queries org-scoped + RLS (Doc 14). No endpoint accepts a client-supplied `orgId` without membership check.
- Filter DSL is **allowlist-compiled** — clients can never express raw SQL or unscoped fields.
- Platform tokens are scoped (read/write per resource) and hashed at rest.
- Mutation endpoints that touch external systems (send, integration push) go through the outbox (Doc 05 §6) — idempotent, no double-fire.
- Every sensitive mutation emits an `AuditLog` row via interceptor.
