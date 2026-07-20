# 10 — Scraper / Discovery Architecture

> **Read this section first, honestly.** "Discover businesses from the whole internet" is the product's soul,
> but *how* you collect data is the difference between a defensible SaaS and a lawsuit / IP ban / dead sending
> domain. This doc designs for the collection you can actually operate at scale — and is explicit about the
> lines we don't cross.

---

## 1. The legal reality (don't skip this)

Not all "sources" are equal. Three buckets:

| Bucket | Examples | Our approach |
|---|---|---|
| ✅ **Official / licensed APIs** | Google Places API, SerpAPI/Bing Web Search API, Google Play Developer surfaces, Apple App Store API, marketplace product APIs, licensed B2B data (Apollo/PDL/Clearbit/Hunter via their APIs) | **Primary path.** Pay for access; respect quotas; store per their ToS. |
| ⚠️ **Public pages of the prospect's OWN site** | Fetching `acme-plumbing.com` to run Lighthouse/SSL/tech/screenshot | **Allowed with care.** We audit the target's *own* public homepage — materially different from scraping a database. Respect robots.txt, rate-limit, identify our bot, cache. |
| 🚫 **Auth-walled / ToS-prohibited scraping** | LinkedIn behind login, Facebook/Instagram private data, bulk-scraping a competitor's directory, bypassing CAPTCHAs/anti-bot | **Not built.** No credential-based scraping, no CAPTCHA solving, no ToS circumvention. LinkedIn/social data comes only from licensed providers or the platform's official APIs. |

**Why this matters concretely:** *hiQ v. LinkedIn* softened but did **not** legalize scraping ToS-protected
platforms; CFAA, breach-of-contract, and DMCA exposure remain real; and the GDPR/CCPA angle applies to any PII
you store regardless of how "public" it was. The product is designed so its **core value (website/app quality
intelligence)** comes from auditing the prospect's own site — the least legally fraught, most defensible signal —
and **contact data comes from licensed providers** who carry the compliance burden contractually.

This is not legal advice; before launch, get a real lawyer to review the source list and your DPA. The
architecture below is built to make "swap a risky source for a compliant one" a config change, not a rewrite.

---

## 2. Source Registry (pluggable collectors)

Every source implements one interface, so the discovery engine is source-agnostic:

```ts
interface Collector {
  id: SourceId
  kind: 'api' | 'site-audit' | 'sitemap'
  compliance: { robotsRespected: boolean; ratePerMin: number; requiresLicense: boolean; tos: string }
  estimate(filters: FilterTree): Promise<{ count: number; creditCost: number }>
  collect(filters: FilterTree, ctx: CollectCtx): AsyncIterable<CandidateRaw>
}
```

Registered collectors (v1 target):
- `google_places` (Maps Finder) — Places API
- `serp` — SerpAPI/Bing Web Search for keyword+geo web discovery
- `play_store`, `app_store` — app metadata via official/licensed endpoints
- `marketplace.{amazon,flipkart,etsy}` — product-search provider APIs
- `sitemap` — given a domain, read `sitemap.xml`/`robots.txt` to enumerate the target's own pages for auditing
- `directory.{yelp,justdial,...}` — **only** where an official API exists; otherwise omitted

New sources are added by dropping a collector into `packages/providers` — no engine change.

---

## 3. The compliance engine (enforced, not documented-and-ignored)

Before any HTTP fetch to a target site:
1. **robots.txt check** — cached per host; disallowed paths are skipped. A global "respect robots" flag is on and not user-toggleable for auditing fetches.
2. **Rate limiter** — per-host token bucket (default ≤1 req/2s/host) + global concurrency cap; backoff on 429/503.
3. **Identify ourselves** — descriptive User-Agent with a contact URL (`LeadGenEngineBot/1.0 (+https://.../bot)`), not a spoofed browser UA, for audit fetches.
4. **Politeness window** — heavy crawling throttled; never hammer a small business's server.
5. **Cache + TTL** — an audited domain isn't re-fetched within its TTL; dedupe prevents re-spending.
6. **Provider quota guard** — licensed-API calls checked against remaining quota before firing.

A per-source **policy object** drives all of the above; flipping a source from "on" to "off" or changing its
rate is config, and the admin panel shows per-source compliance status + spend.

---

## 4. Rendering & audit service (Python, isolated)

The `services/render` FastAPI service is where untrusted pages are actually loaded — isolated from the API/DB:

```
POST /render/audit  { url }  →  {
  screenshotFullUrl, screenshotAtfUrl,
  lighthouse: {...}, ssl: {...}, headers: {...},
  tech: [...], brokenAssets: {...}, meta: {...}
}
```

- **Playwright** (headless Chromium) in a **locked-down container**: no host network beyond the target, seccomp profile, non-root, ephemeral, per-job timeout, memory cap, `--disable-dev-shm` etc. A malicious page cannot reach internal services (SSRF-guarded: block private IP ranges, metadata endpoints, `file://`).
- **Lighthouse** run via Node child for performance + CWV + accessibility + SEO signals.
- **Screenshots** (full + above-the-fold) → object storage; only URLs returned.
- **Tech fingerprinting** (Wappalyzer-style ruleset) for CMS/framework/hosting/analytics/pixel detection.
- **SSRF & abuse guards:** URL allowlist scheme (http/https only), DNS-rebind protection, redirect cap, response-size cap, block private/link-local/metadata IPs.

Horizontally scalable: N render pods behind the audit queue; the crashy/insecure work is quarantined here, never in the API.

---

## 5. Anti-abuse (protecting *us* and *them*)

- We are a good web citizen (robots, rate, identify) — protects our IPs from blacklisting and small sites from load.
- **Our own** platform is protected from users abusing it as a mass-scraper: per-org discovery/audit quotas (Doc 17), anomaly detection on burst patterns, and a hard rule that a user can't point the auditor at arbitrary high-volume targets outside discovery flows.
- **No** proxy-rotation-to-evade-bans infrastructure. If a source blocks our compliant bot, we stop, not escalate. (We may use *declared* geo-distributed egress for latency/locale, not for ban evasion.)

---

## 6. Dedupe & identity resolution

- **Canonical domain** is the primary key: strip `www`, lowercase, resolve `http↔https`, follow one redirect, drop tracking params. `dedupeKey = sha256(canonicalDomain)`.
- No domain (e.g., a Maps result with only a phone): `dedupeKey = sha256(normalizedName + '|' + city + '|' + country)`.
- Cross-source merge: the same business found via Places + SERP collapses to one `Candidate` (`@@unique(orgId, dedupeKey)`), with sources arrayed.
- Fuzzy near-dup detection (name similarity + geo proximity) flags likely dupes for the score/merge step; embeddings assist ambiguous cases.

---

## 7. Data flow (discovery worker)

```mermaid
flowchart TD
  R[DiscoveryRun QUEUED] --> F[Fan-out: one job per source]
  F --> C[Collector.collect(filters) — API-first, compliant]
  C --> N[Normalize → CandidateRaw]
  N --> D{dedupeKey seen?}
  D -- yes --> M[Merge sources, skip re-audit if fresh]
  D -- no --> S[Store Candidate]
  S --> A[Enqueue website+ui+app audit → render svc]
  A --> E[Enqueue enrichment waterfall]
  E --> SC[Enqueue score]
  SC --> P[Promote Candidate → Lead]
  P --> DONE[Run stats updated; leads stream to UI]
```

---

## 8. Freshness & re-audit

- Every collected fact carries `fetchedAt`. Audits have a TTL (default 30–90d by plan); stale leads get re-audit jobs on a scheduler so scores don't rot.
- Re-audit is cheap-first: cheap checks (SSL expiry, HTTP status) run often; full Lighthouse + vision run less often.

---

## 9. What we ship in v1 vs. later

| v1 (compliant, API-first) | Later (with legal sign-off + demand) |
|---|---|
| Places/Maps, SERP web discovery, app-store metadata, own-site auditing, licensed enrichment/verification | More marketplaces, more directories (where APIs exist), Chrome-extension capture (user manually flags pages they're browsing — the user's own browsing, not our bot), broader social via official APIs |

The Chrome "discovery" is deliberately a **capture inbox**: the *user* browses and flags pages; the extension
sends the URL to be audited. That's the user acting as themselves in their own browser — not our infrastructure
scraping at scale — which is both compliant and genuinely useful.
