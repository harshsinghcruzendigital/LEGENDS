# 11 — Queue System (BullMQ)

Redis-backed BullMQ. The queue is the backbone of everything asynchronous: discovery, auditing, enrichment,
scoring, sending, workflows. Workers run as a separate deployable (`apps/workers`) sharing `packages/*`.

## 1. Queues & concurrency

| Queue | Job | Concurrency | Rate limit | Notes |
|---|---|---|---|---|
| `discovery` | fetch from a source | 10 | per-source policy (Doc 10) | fans out per source |
| `website-audit` | Lighthouse+SSL+tech | 20 (bound by render pods) | ≤1 req/2s/host | calls Python render svc |
| `ui-audit` | vision scoring | 8 | AI Gateway budget | expensive; cached by screenshot hash |
| `app-audit` | store metadata + sentiment | 10 | provider quota | |
| `enrichment` | provider waterfall | 15 | per-provider quota | stops at first high-confidence hit |
| `verify` | email verification | 20 | SMTP politeness | |
| `score` | rubric compute | 30 | — | pure-ish; fast |
| `send` | outbound email step | per-mailbox limit | per-mailbox daily cap + window | outbox-driven, idempotent |
| `workflow` | execute a workflow run | 15 | — | reactive to events |
| `schedule` | cron: re-audit, recurring ICPs | 5 | — | repeatable jobs |
| `export` | build CSV | 5 | — | signed link on done |
| `integration` | push to HubSpot/Sheets/… | 10 | per-integration | outbox-driven |

## 2. Reliability primitives

- **Idempotency:** every job carries a stable `jobId` (`discovery:{runId}:{source}`, `audit:{leadId}:website`, `send:{enrollmentId}:{step}`). BullMQ dedupes; retries never double-spend credits or double-send.
- **Retries:** exponential backoff (`attempts: 5`, `backoff: { type:'exponential', delay:5000 }`), with per-queue overrides. Transient (429/timeout) retried; permanent (404/invalid) fails fast to DLQ.
- **Dead-letter queue** per family; admin queue board (Doc 08 `admin.queues`) shows failures with payload + stack; one-click retry/drain.
- **Rate limiting:** BullMQ limiter per queue **plus** a Redis token-bucket keyed by host/provider for fine-grained politeness (Doc 10 §3).
- **Priorities:** user-triggered ad-hoc audits > scheduled re-audits > bulk discovery backfill.
- **Job TTL + stalled-job recovery:** locks + `stalledInterval` so a crashed worker's jobs re-run, not vanish.
- **Flow (parent/child):** BullMQ **Flows** model the dependency `discovery → audit → enrich → score → promote` as a job tree; the run completes only when children do; `PARTIAL` if some sources/children fail.

## 3. Backpressure & cost control

- Global concurrency caps prevent a huge discovery from starving ad-hoc scans.
- **UsageGuard** checks org quota *before* enqueuing metered work; a run that would exceed the plan cap is trimmed with a clear message (Doc 17).
- Provider spend is metered per job; admin dashboards alert on burn-rate anomalies.

## 4. Scheduling

- **Repeatable jobs** for recurring ICPs (`Icp.schedule` cron) and re-audit sweeps (freshness TTL, Doc 10 §8).
- A single `schedule` queue owns cron; it enqueues concrete work into the domain queues (no cron logic scattered around).

## 5. Observability

- Every job logs start/end/duration/result + `orgId` to structured logs (pino) with the run/trace id.
- Metrics: queue depth, processing rate, failure rate, p95 latency per queue → Prometheus/Grafana (Doc 15).
- Bull Board (or Taskforce) mounted at `/admin/queues` behind staff RBAC.

## 6. Scaling path

Start: one Redis, worker pods per queue-family scaled independently (audit pods scale with render pods).
At scale: partition hot queues (audit) onto dedicated Redis; migrate the highest-throughput, at-least-once
streams (tracking events) to SQS/Kafka if BullMQ becomes the bottleneck — the producer interface in
`apps/api/src/queue` abstracts this so callers don't change.
