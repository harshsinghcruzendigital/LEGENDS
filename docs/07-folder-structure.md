# 07 — Folder Structure (Turborepo Monorepo)

One repo, typed end-to-end. `pnpm` workspaces + Turborepo for task orchestration and caching.

```
leadgen-engine/
├─ apps/
│  ├─ web/                        # Next.js 15 frontend
│  │  ├─ app/                     # App Router (route groups per Doc 06)
│  │  ├─ components/              # app-specific composed components
│  │  ├─ features/                # feature slices (discovery, leads, crm, campaigns...)
│  │  │  └─ leads/{components,hooks,api,types}.ts
│  │  ├─ lib/                     # client utils, tRPC client, query client
│  │  ├─ hooks/                   # shared hooks (useDiscoveryStream, useSelection)
│  │  ├─ styles/                  # tailwind globals, tokens import
│  │  └─ public/
│  │
│  ├─ api/                        # NestJS modular monolith (Doc 05)
│  │  ├─ src/
│  │  │  ├─ main.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ common/               # guards, interceptors, decorators, filters
│  │  │  ├─ trpc/                 # tRPC root router + context
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/  org/  rbac/  user/
│  │  │  │  ├─ discovery/  audit/  enrichment/  verification/  scoring/
│  │  │  │  ├─ lead/  crm/  campaign/  mailbox/
│  │  │  │  ├─ workflow/  automation/  integration/  assistant/
│  │  │  │  ├─ billing/  usage/  notification/  auditlog/  admin/
│  │  │  │  ├─ search/  files/  health/
│  │  │  │  └─ <module>/{*.controller.ts,*.service.ts,*.repository.ts,dto/,*.router.ts}
│  │  │  ├─ ai/                   # AI Gateway (routing, guardrails, caching, metering)
│  │  │  ├─ queue/                # BullMQ producers + queue definitions
│  │  │  └─ events/               # domain event bus (Redis Streams)
│  │  └─ test/
│  │
│  ├─ workers/                    # Node BullMQ consumers (Doc 11) — deploys separately, shares packages
│  │  ├─ src/processors/
│  │  │  ├─ discovery.processor.ts
│  │  │  ├─ website-audit.processor.ts
│  │  │  ├─ ui-audit.processor.ts
│  │  │  ├─ app-audit.processor.ts
│  │  │  ├─ enrichment.processor.ts
│  │  │  ├─ score.processor.ts
│  │  │  ├─ send.processor.ts
│  │  │  └─ workflow.processor.ts
│  │  └─ src/index.ts             # worker bootstrap + concurrency config
│  │
│  └─ admin/                      # (optional) separate staff console; can also be a route group in web
│
├─ services/
│  └─ render/                     # Python FastAPI: Playwright + Lighthouse + screenshots + vision preprocess
│     ├─ app/{main.py,routes/,browser/,lighthouse/,screenshot/,tech_fingerprint/}
│     ├─ requirements.txt
│     └─ Dockerfile
│
├─ packages/
│  ├─ db/                         # Prisma schema + client + migrations + seed
│  │  ├─ prisma/{schema.prisma,migrations/,seed.ts}
│  │  └─ src/index.ts             # exported PrismaClient + TenantPrisma wrapper
│  ├─ ui/                         # @leadgen/ui — shadcn wrapped + glass components (Doc 13)
│  │  ├─ src/components/{glass-card,stat-tile,score-ring,severity-badge,data-grid,...}
│  │  └─ src/tokens/              # design tokens (single source, exported to tailwind)
│  ├─ config/                     # shared tsconfig, eslint, tailwind preset, prettier
│  ├─ schemas/                    # zod schemas shared by web forms + api DTOs (single source of truth)
│  ├─ scoring/                    # pure, testable lead-scoring rubric engine (versioned)
│  ├─ filter-dsl/                 # Filter DSL types + compiler (client emits, server compiles) (Doc 04 §11)
│  ├─ types/                      # shared TS types + tRPC AppRouter type export
│  ├─ providers/                  # typed clients for Places/SERP/Hunter/Clearbit/... (rate-limited, cached)
│  ├─ ai-sdk/                     # thin wrappers over Anthropic/OpenAI/Gemini used by AI Gateway
│  └─ integrations/               # hubspot/salesforce/slack/sheets connectors (shared by api + workers)
│
├─ infra/
│  ├─ docker/                     # Dockerfiles per app + docker-compose.dev.yml (pg, redis, minio, mailhog)
│  ├─ k8s/                        # Helm charts / manifests (Doc 15)
│  ├─ terraform/                  # cloud infra (post-MVP)
│  └─ github/workflows/           # CI/CD (Doc 15)
│
├─ docs/                          # THESE documents
├─ .env.example                   # every required env var, documented
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
└─ README.md
```

## Boundary rules (enforced by ESLint import rules)

- `apps/*` may import from `packages/*`, never from another app.
- A NestJS module imports another module's **service**, never its **repository**.
- `packages/schemas`, `packages/filter-dsl`, `packages/scoring` are **pure** (no I/O) so both web and api use them identically.
- `packages/providers` is the *only* place that talks to external data providers — one throttle/cache/retry policy per provider, reused everywhere.
- `packages/db` owns Prisma; nothing else instantiates a `PrismaClient`.

## Why a monorepo

End-to-end type safety (tRPC `AppRouter` type flows into the web client; zod schemas shared; Prisma types
shared), atomic cross-cutting changes, one CI graph with Turbo caching. Workers share the exact same
`packages/db`, `packages/providers`, and `packages/scoring` as the API — no drift between "what the API thinks"
and "what the worker does."
