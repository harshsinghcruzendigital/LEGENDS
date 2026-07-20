# 05 — Backend Architecture

## 1. Shape: a modular monolith + Python worker services

We deliberately **do not** start with microservices. The API is a **NestJS modular monolith** (clear module
boundaries, one deployable) fronting a **Postgres + Redis** core, with **Python (FastAPI) worker services** for
the CPU/browser-heavy jobs (headless rendering, Lighthouse, screenshots, AI vision). This gives service-grade
separation where it matters (scraping/rendering isolation, independent scaling) without premature distributed-systems tax.

```mermaid
flowchart LR
  subgraph Client
    W[Next.js web] 
    X[Chrome extension]
  end
  W -->|tRPC/HTTPS| G[NestJS API Gateway]
  X -->|REST| G
  G --> PG[(PostgreSQL 16)]
  G --> RD[(Redis)]
  G -->|enqueue| Q{{BullMQ}}
  Q --> DW[Discovery worker (Node)]
  Q --> AW[Audit worker (Node orchestrator)]
  Q --> EW[Enrich worker (Node)]
  Q --> SW[Score worker (Node)]
  Q --> CW[Campaign/send worker (Node)]
  Q --> WW[Workflow worker (Node)]
  AW -->|HTTP| PY[Python render/audit svc (FastAPI+Playwright+Lighthouse)]
  EW -->|HTTP| PR[Providers: Places/SERP/Hunter/Clearbit/...]
  AW -->|HTTP| AI[AI Gateway → Claude/OpenAI/Gemini]
  SW --> AI
  CW -->|SMTP/API| MB[User mailboxes]
  G -. events .-> OB[(Object storage: screenshots/reports)]
```

## 2. NestJS module map

Each module = controller (tRPC router + REST where needed) + service (business logic) + repository (Prisma) +
DTOs/validators (zod). Modules never import each other's repositories — only their services (enforced by lint boundaries).

```
AuthModule            sessions, password/OAuth/SSO, invitations
OrgModule             orgs, teams, memberships, branding
RbacModule            role→permission resolution, guards, policy engine
UserModule            profiles, notification prefs
DiscoveryModule       ICPs, runs, candidates, dedupe, source registry
AuditModule           website/ui/app audit orchestration + findings + public reports
EnrichmentModule      provider waterfall, provenance, credits
VerificationModule    email verification
ScoringModule         rubric engine, versioning
LeadModule            leads, contacts, saved views, bulk ops, filter compiler
CrmModule             deals, tasks, meetings, notes, activity
CampaignModule        campaigns, sequences, enrollments, messages, events, suppression
MailboxModule         mailbox connect (OAuth), send abstraction, warmup
WorkflowModule        workflow CRUD + execution API
AutomationModule      trigger registry (event bus → workflow runs)
IntegrationModule     hubspot/salesforce/slack/sheets/zapier connectors
AssistantModule       AI chat, tool registry, NL→filter
BillingModule         Stripe, subscriptions, plan gates
UsageModule           metering, caps, quota enforcement (guard)
NotificationModule    in-app + email + slack notifications
AuditLogModule        write + query audit trail
AdminModule           staff-only ops, impersonation, queue board
SearchModule          FTS / OpenSearch abstraction, embeddings
FilesModule           object storage (screenshots, report PDFs, CSV exports)
HealthModule          liveness/readiness, provider health
```

## 3. Request lifecycle & cross-cutting middleware

Order per request:
1. **RequestId** + structured logger context (pino).
2. **AuthGuard** — resolve session → `user`.
3. **OrgContextGuard** — resolve active `orgId`; set Postgres session var `app.org_id` (drives RLS).
4. **RbacGuard** — `@RequirePermission('lead:delete')` decorators → policy engine (Doc 14).
5. **UsageGuard** — for metered actions, check quota before executing; record `UsageEvent` after.
6. **Validation** — zod DTO parse (reject on fail).
7. **Handler** → service → repository (Prisma, always org-scoped).
8. **Interceptors** — response envelope, audit-log emit for sensitive mutations, error normalization.

Every tenant query goes through a `TenantPrisma` wrapper that injects `orgId` and forbids cross-org access at
compile time (typed repositories) and runtime (RLS) — belt and suspenders.

## 4. The AI Gateway (internal service)

A single internal abstraction all AI calls pass through, so providers are swappable and everything is metered/guarded:

- **Routing:** task → model (e.g., vision + reasoning → Claude Opus; embeddings → OpenAI `text-embedding-3`; cheap classify → Haiku). BYO-key support per org.
- **Guardrails:** token budgets per org/plan, prompt-injection scrubbing on scraped text, output schema validation (LLM must return valid JSON matching a zod schema or it's rejected/retried).
- **Caching:** deterministic prompts (e.g., "classify this tech stack") cached by input hash.
- **Observability:** every call logged with tokens, latency, cost, model, cache-hit; rolled into `UsageEvent`.
- **Fallback:** provider error → secondary model; never silently degrade a *factual* audit (AI only narrates facts).

See Doc 09 for the agent/tool layer that sits on top of this gateway.

## 5. Event bus & automation triggers

Domain events (`lead.created`, `lead.scored`, `audit.completed`, `email.replied`, `stage.changed`) are emitted
onto Redis Streams. The **AutomationModule** subscribes, matches against active `Workflow.trigger` configs, and
enqueues `WorkflowRun`s. This decouples "something happened" from "what should happen," and makes the workflow
engine (Doc 12) purely reactive.

## 6. Data flow: consistency & idempotency

- **Idempotency keys** on all queue jobs (`dedupeKey` for discovery, `leadId+auditType` for audits) so retries don't double-spend credits or double-send emails.
- **Outbox pattern** for external side-effects (email send, integration push): write intent to DB in the same txn as state change, worker delivers, marks sent — no lost/duplicate sends.
- **Optimistic concurrency** on Lead/Deal edits (`updatedAt` check) to avoid clobbering in multi-user orgs.

## 7. Object storage & files

Screenshots, generated report PDFs, and CSV exports live in S3-compatible storage (MinIO in dev, S3 in prod).
DB stores only URLs/keys. Public reports are served via signed, cacheable URLs; exports via short-lived signed links.

## 8. Configuration & secrets

- 12-factor config via env, validated at boot with zod (`ConfigModule` fails fast on missing/invalid).
- Secrets (OAuth tokens, SMTP creds, BYO API keys) encrypted at rest with envelope encryption (KMS data key → per-secret DEK); DB stores ciphertext + `secretRef` (Doc 14 §Encryption).

## 9. Why these choices (trade-offs, stated)

| Decision | Alternative | Why we chose it |
|---|---|---|
| Modular monolith | Microservices from day 1 | Faster iteration, one deploy, real boundaries; split later only where load demands (audit/render already split) |
| Python for render/audit | All-Node | Playwright + Lighthouse + vision preprocessing are best-in-class in Python/Node hybrid; isolates crashy browser work |
| tRPC (+ selective REST) | Pure REST/GraphQL | End-to-end types with Next.js; REST only for webhooks, extension, integrations |
| BullMQ on Redis | Kafka/SQS | Right-sized; great DX + dashboard; migrate hot queues to SQS/Kafka at scale (Doc 11) |
| Postgres FTS first | Elasticsearch day 1 | Fewer moving parts; OpenSearch introduced only when search load justifies (Doc 15) |
| RLS + app-layer scoping | App-layer only | Defense-in-depth against tenant-leak bugs — the one class of bug that kills a B2B SaaS |
