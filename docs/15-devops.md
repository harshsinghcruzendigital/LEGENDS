# 15 — DevOps / CI-CD / Observability

## 1. Environments

| Env | Purpose | Infra |
|---|---|---|
| **dev (local)** | day-to-day | `docker-compose.dev.yml`: Postgres, Redis, MinIO (S3), Mailhog (SMTP), the Python render svc |
| **preview** | per-PR ephemeral | auto-deployed on PR; seeded demo org |
| **staging** | pre-prod mirror | same topology as prod, smaller |
| **production** | live | see §4 |

`.env.example` documents every variable; `ConfigModule` validates at boot (fail-fast).

## 2. Containerization

- Multi-stage Dockerfiles per app (`web`, `api`, `workers`, `services/render`). Non-root, distroless/slim base, pinned digests.
- `render` image bundles Chromium + Lighthouse; hardened (seccomp, read-only FS, no host net beyond target) — Doc 10 §4.
- Turborepo remote cache speeds CI builds; only changed apps rebuild.

## 3. CI/CD (GitHub Actions)

**CI (every PR):**
1. Install (pnpm, cached) → `turbo run lint typecheck test build` (affected-only).
2. Unit + integration tests (Vitest/Jest) against ephemeral Postgres/Redis (services in the job).
3. Prisma migrate check (no drift; migrations reviewed).
4. Security: `pnpm audit`/Snyk, secret scan (gitleaks), SAST (CodeQL), Docker image scan (Trivy).
5. E2E smoke (Playwright) on preview deploy.
6. Bundle-size + Lighthouse CI budget check on `web` (we hold ourselves to our own CWV bar).

**CD:**
- Merge to `main` → build+push signed images → deploy **staging** → run migrations (expand/contract, backward-compatible) → E2E → **manual approval** → **production** (rolling/canary).
- DB migrations are **decoupled** from deploys (expand → deploy → migrate data → contract) so rollbacks never break schema.
- Feature flags (Doc 08 `admin.flags`) gate risky features + plan entitlements — decouple deploy from release.

## 4. Production topology

MVP (fast + cheap): **Fly.io / Railway / Render** — managed Postgres (+ read replica), managed Redis, S3, containers for web/api/workers/render.

Scale: **AWS EKS** —
```
ALB → web (Next) pods         (HPA on CPU/RPS)
     → api (NestJS) pods       (HPA)
worker pods per queue-family   (KEDA autoscale on queue depth)
render pods                    (KEDA on audit queue; isolated node pool)
RDS Postgres (Multi-AZ + read replicas) · ElastiCache Redis · S3 · OpenSearch (at scale)
Secrets: AWS Secrets Manager + KMS · Egress via NAT
```
- **KEDA** scales workers on BullMQ/Redis queue depth (audit pods follow discovery load).
- Render pods on an isolated, tainted node pool (browser blast-radius containment).

## 5. Observability (the three pillars + product)

- **Logs:** pino structured JSON, correlated by `requestId`/`runId`/`orgId` → Loki/CloudWatch/Datadog. Secret redaction enforced.
- **Metrics:** Prometheus → Grafana. Golden signals per service + queue depth/latency/failure, provider spend, AI tokens/cost, CWV of our own app.
- **Traces:** OpenTelemetry across web→api→workers→render→providers; sample + tail-based on errors.
- **Errors:** Sentry (web + api + workers) with source maps + release tracking.
- **Product analytics:** PostHog for funnels (activation, first-sequence-sent), self-hostable, privacy-friendly.
- **Uptime/synthetics:** external probes on `/health` + a scripted "run a tiny discovery" canary.

## 6. Alerting & SLOs

| SLO | Target |
|---|---|
| API availability | 99.9% |
| p95 API latency (reads) | < 300ms |
| Discovery run start → first lead | < 60s p50 |
| Email send success | > 99% |
| Tenant-scope violation | **0** (any occurrence pages on-call immediately) |

Alerts route to on-call (PagerDuty/Opsgenie). Burn-rate alerts on error budgets; anomaly alerts on provider spend + bounce rate.

## 7. Data management

- **Backups:** automated daily + PITR (WAL) for Postgres; object-storage versioning; **restore drills quarterly**.
- **RPO ≤ 5min, RTO ≤ 1h** (prod).
- **Partitioning/retention:** monthly partitions on `Activity/Event/AuditLog/UsageEvent`; drop/archive per plan retention.
- **Migrations:** Prisma Migrate, reviewed, expand/contract, never destructive-in-place.

## 8. Cost governance

- Provider spend (Places/SERP/enrich/AI) metered per org and globally; admin dashboard + budget alerts.
- Caching (audits, AI vision, robots.txt) is the primary cost lever; per-plan hard caps prevent runaway bills (Doc 17).
- Turbo remote cache + affected-only CI keep pipeline minutes down.

## 9. Testing strategy (the pyramid)

- **Unit:** pure packages (`scoring`, `filter-dsl`, `schemas`) — high coverage, fast.
- **Integration:** module + Prisma against real Postgres (Testcontainers); provider clients against recorded fixtures.
- **Contract:** tRPC router type tests; provider adapter contract tests.
- **E2E:** Playwright — onboarding→discovery→lead→sequence happy path + RBAC negative paths (a Viewer cannot delete).
- **AI evals:** golden-set scoring drift + report factual-consistency + injection red-team (Doc 09 §5) run in CI.
- **Load:** k6 on the grid (100k-row filter/sort) and the audit pipeline throughput.
- **Security:** SAST/DAST/dep-scan in CI; periodic pentest before GA.
