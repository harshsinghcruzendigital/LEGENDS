# LEAD GEN ENGINE — Architecture Documentation

> An AI-native lead-generation platform that **discovers** businesses with fixable problems
> (broken/outdated/slow websites, bad UX, SEO gaps, poor apps) from public sources,
> then **analyzes, enriches, scores, and works** them as sales opportunities.
>
> Positioning: the discovery breadth of Apollo/ZoomInfo, the enrichment/waterfall logic of Clay,
> the outreach engine of Instantly/Lemlist, and a website/app **quality-intelligence layer** none of them have.

---

## 0. How to read these docs

These are **build documents**, not marketing. Every schema is meant to become a real Prisma model,
every endpoint a real controller, every agent a real service. They are written so an engineer can
open a file and start implementing.

| # | Doc | Status | What it answers |
|---|-----|--------|-----------------|
| 01 | [Product Requirements (PRD)](./01-PRD.md) | ✅ | What we're building, for whom, why, and the guardrails |
| 02 | [Information Architecture](./02-information-architecture.md) | ✅ | Every screen, the nav model, URL map |
| 03 | [User Flows](./03-user-flows.md) | ✅ | Onboarding, discovery→campaign, enrichment loops |
| 04 | [Database Schema + ER Diagram](./04-database-schema.md) | ✅ | Every table, column, relationship, index |
| 05 | [Backend Architecture](./05-backend-architecture.md) | ✅ | Service boundaries, modules, data flow |
| 06 | [Frontend Architecture](./06-frontend-architecture.md) | ✅ | App Router structure, state, data fetching |
| 07 | [Folder Structure (Monorepo)](./07-folder-structure.md) | ✅ | Exact directory layout |
| 08 | [API Specification](./08-api-spec.md) | ✅ | REST + tRPC contracts, auth, pagination |
| 09 | [AI Agent Architecture](./09-ai-agents.md) | ✅ | Every agent, its tools, prompts, guardrails |
| 10 | [Scraper / Discovery Architecture](./10-scraper-architecture.md) | ✅ | Collectors, compliance, anti-abuse, the **legal reality** |
| 11 | [Queue System](./11-queue-system.md) | ✅ | BullMQ queues, workers, rate limits, retries |
| 12 | [Workflow / Automation Engine](./12-workflow-engine.md) | ✅ | Visual builder, triggers, actions, execution model |
| 13 | [Design System](./13-design-system.md) | ✅ | Tokens, glassmorphism, components, motion |
| 14 | [Security, RBAC & Multi-tenancy](./14-security-rbac.md) | ✅ | Auth, orgs/teams, permissions, audit, encryption |
| 15 | [DevOps / CI-CD / Observability](./15-devops.md) | ✅ | Docker, K8s, pipelines, logging, monitoring |
| 16 | [Roadmap (MVP → Scale)](./16-roadmap.md) | ✅ | Phased plan with honest effort estimates |
| 17 | [Pricing & Packaging](./17-pricing.md) | ✅ | Plans, metering, usage limits |

✅ = written · all 18 foundational docs complete. Next: scaffold the monorepo (Doc 07) or build the Phase-1 vertical slice (Doc 16).

---

## 1. The one-paragraph product

Agencies and freelancers waste hours hunting for clients. **Lead Gen Engine** flips that: you describe
who you help ("Shopify stores with slow, ugly mobile sites in the US home-goods niche") and the platform
continuously discovers matching businesses from public sources, **runs a real technical + visual audit on
each** (Lighthouse/CWV, SSL, SEO, broken assets, AI-vision UI scoring, app-store health), enriches them with
verified contacts and firmographics, **scores the opportunity 0–100**, and hands you a ranked pipeline you
can work with built-in CRM, sequences, and automation. The audit itself becomes the sales pitch: "your
homepage scores 34/100 on mobile and here's the 8-point fix."

## 2. Why this wins (the wedge)

Every incumbent sells *contact data*. None sells **opportunity signal derived from the prospect's own web
presence**. A broken website is a buying signal that is (a) objective, (b) demonstrable to the prospect, and
(c) directly tied to what the target user (an agency) actually sells. That's the moat: **quality intelligence
as the lead-qualification primitive.**

## 3. Guiding principles

1. **Signal over volume.** 200 businesses with a proven, fixable problem beat 200k raw contacts.
2. **The audit is the product.** Every lead ships with a shareable, branded report that *is* the cold-email hook.
3. **AI does the judgement, deterministic code does the facts.** Lighthouse gives the numbers; the LLM writes the narrative and prioritizes — it never invents metrics.
4. **Compliance is a feature, not an afterthought.** See [Doc 10 §Legal](./10-scraper-architecture.md). We respect robots.txt, rate limits, official APIs first, and per-jurisdiction outreach law (GDPR/CAN-SPAM/CASL).
5. **Multi-tenant from line one.** Every row carries an `orgId`. No exceptions.

## 4. Tech stack (as committed)

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS · shadcn/ui · Framer Motion · TanStack Table/Query · Recharts
- **API:** NestJS · tRPC (typed client) · Prisma · PostgreSQL 16 · Redis · BullMQ
- **AI/Scrape services (Python):** FastAPI · Playwright · httpx · selectolax/BeautifulSoup · Lighthouse (Node child) · unstructured
- **AI:** Anthropic Claude (primary reasoning + vision) · OpenAI (embeddings/fallback) · pgvector for semantic search
- **Search:** Postgres FTS first → OpenSearch/Elasticsearch at scale
- **Infra:** Docker · Turborepo · GitHub Actions · deploy to Fly.io/Railway (MVP) → AWS EKS (scale)

> Note on "real integrations now": the discovery layer prefers **official/licensed APIs** (Google Places,
> SerpAPI, Play Store, RapidAPI providers) over raw scraping wherever one exists. Where we do fetch pages,
> it's the prospect's *own public site* for auditing — a materially different legal posture than scraping a
> competitor's database. Details and the honest risk table live in [Doc 10](./10-scraper-architecture.md).
