# 01 — Product Requirements Document

**Product:** Lead Gen Engine
**Version:** 1.0 (Foundational)
**Owner:** Founder / Product
**Status:** Approved for build

---

## 1. Problem statement

Service businesses that *fix digital presence* (web design, Shopify dev, SEO, app dev, marketing) all share
the same top-of-funnel pain: **finding prospects who provably need the service is slow, manual, and
low-signal.** Buying contact lists gives you emails, not *reasons to reach out*. Cold outreach without a
specific, credible hook converts at fractions of a percent.

Meanwhile, the *evidence of need* is sitting in public: the prospect's own website is slow, insecure,
un-responsive, or ugly; their app has 2.3 stars and hasn't shipped in two years; their Google Business
listing is thin. That evidence is **discoverable and measurable at scale** — but no tool packages
*discovery + technical audit + contact enrichment + a ready-to-send pitch* in one loop.

## 2. Vision

> A self-driving pipeline of qualified opportunities. You define your ideal customer once; the engine finds
> them forever, proves why they need you, and gives you the exact words to open the conversation.

## 3. Goals & non-goals

### Goals (v1)
- Discover businesses from public sources filtered by industry/geo/tech/category.
- Run an automated, objective **website audit** (performance, security, SEO, accessibility, tech, broken assets).
- Run an **AI-vision UI/UX audit** on screenshots (UI, UX, trust, branding, conversion, modernity scores).
- Run an **app-store audit** (rating, freshness, review sentiment, screenshot quality).
- **Enrich** each business with contacts (emails/phones/socials), firmographics, and decision-makers via licensed providers.
- **Verify** emails (syntax, MX, SMTP, catch-all, disposable, confidence).
- **Score** each lead 0–100 with an explainable rubric.
- Store leads in a fast, filterable **database + Kanban + CRM**.
- Send **AI-personalized sequences** with open/click/reply tracking.
- **Automate** the loop with a visual workflow builder.
- Be **multi-tenant, RBAC-secured, and audit-logged** from day one.

### Non-goals (v1 — explicitly out)
- Scraping login-walled data (LinkedIn behind auth, private profiles). We use LinkedIn *only* via compliant/official surfaces or licensed providers.
- Sending on the user's behalf without their own connected mailbox / verified domain (no shared spam infra).
- Building our own Lighthouse/headless-render farm at scale on day one (we start with hosted APIs).
- Payments/dunning beyond Stripe subscription basics.
- Mobile native apps (responsive web only in v1).

## 4. Target users & JTBD

| Persona | Job-to-be-done | Primary value |
|---|---|---|
| **Digital / web-design agency** | "Find local businesses with bad websites I can rebuild." | Website + UI audit as the pitch |
| **Shopify developer** | "Find Shopify/Woo stores with slow, poorly-converting storefronts." | Tech-stack + CWV filtering |
| **SEO agency** | "Find sites bleeding rankings — no schema, bad meta, slow." | SEO sub-score + issue list |
| **App developer** | "Find apps with bad ratings / stale builds." | App Scanner opportunity score |
| **Marketing agency** | "Find brands with weak social + no pixel/analytics." | Enrichment + presence gaps |
| **Sales team / SDR** | "Give me a ranked, contactable pipeline daily." | Scoring + CRM + sequences |
| **Freelancer** | "A few great leads a week without paying for Apollo." | Curated, low-volume, high-signal |
| **Business consultant** | "Companies needing digital transformation." | Composite opportunity signals |

**Primary persona for v1 = the digital/web-design + Shopify agency owner (1–20 people).** Everything is
optimized for them first.

## 5. Core user stories (MVP-critical)

- *As an agency owner,* I define an **ICP** ("Shopify home-goods stores, US, mobile-slow") and the engine runs discovery on a schedule.
- *As an agency owner,* I open a lead and see a **screenshot, a website score, and a plain-English list of what's broken** — with severity.
- *As an SDR,* I **filter** the database to `leadScore ≥ 70 AND websiteScore ≤ 40 AND country = US AND email verified`, select all, and **push to a sequence**.
- *As an SDR,* the sequence sends an AI-written email that **references the specific audit finding** and tracks opens/clicks/replies.
- *As a manager,* I see a **dashboard** of pipeline value, conversion %, discoveries today, and AI recommendations.
- *As an admin,* I **invite teammates, assign roles**, and every sensitive action is in the **audit log**.

## 6. Feature scope by module (with acceptance criteria)

### 6.1 Lead Discovery Engine
Search across licensed/official sources (Google Places, SerpAPI/Bing, Play/App Store APIs, marketplace APIs,
public web) filtered by industry, geo (country→zip), category, keywords, tech/CMS/hosting, employees/revenue
(via enrichment), traffic band, language.
**AC:** A saved ICP produces ≥ N candidate businesses, de-duplicated by canonical domain + name+geo, queued for audit.

### 6.2 Website Scanner
Deterministic audit per domain: SSL/TLS + expiry, Lighthouse performance + Core Web Vitals, broken
images/links/404s, meta/title/OG/schema presence, sitemap/robots, analytics/pixel/chat/consent detection,
security headers, mobile-viewport, contact form / CTA presence, ecommerce detection, tech fingerprint
(Wappalyzer-style), domain age (RDAP/WHOIS).
**AC:** Returns a structured `WebsiteAudit` with sub-scores + evidence for each finding; never fabricates a metric.

### 6.3 UI Analyzer (AI Vision)
Full-page + above-the-fold screenshots → Claude vision → scores for UI, UX, Trust, Branding, Conversion,
Modernity (0–100 each) + prioritized recommendations, each grounded in a visible element.
**AC:** Every recommendation cites something on screen; scores are reproducible within ±5 on re-run.

### 6.4 App Scanner
Play Store / App Store metadata: rating, ratings count, last-updated, version, screenshot quality (vision),
review-sentiment sample, changelog staleness → **opportunity score**.
**AC:** Given a store URL/package id, returns `AppAudit` with freshness + sentiment + score.

### 6.5 Marketplace Discovery
Product search on Amazon/Flipkart/Etsy/etc. via provider APIs → identify low-traction brands → resolve brand
→ official website → enrich contacts.
**AC:** From a category query, returns brands with resolved domains + enrichment where available. (Rate-limited, API-first.)

### 6.6 Maps Finder
Google Places / OSM: business name, category, phone, website, rating, reviews, hours, geo, (owner/email via enrichment).
**AC:** Radius/keyword search returns normalized businesses ready for audit + enrichment.

### 6.7 Enrichment
Waterfall across providers (contact + firmographic + decision-makers) with per-field provenance & confidence.
**AC:** Each enriched field records `source`, `confidence`, `fetchedAt`; waterfall stops at first high-confidence hit.

### 6.8 Email Verification
Syntax → MX → SMTP probe → catch-all detection → disposable/role detection → confidence 0–100 + status
(`valid|risky|invalid|unknown`).
**AC:** Deterministic status per address; bulk verify respects provider rate limits.

### 6.9 AI Lead Scoring
Weighted, explainable rubric across website quality, size, revenue, urgency, tech, SEO/UI problems, growth
potential, buy-likelihood, decision-maker-found → 0–100 with factor breakdown.
**AC:** Score is decomposable into named factors with weights; changing a weight re-scores deterministically.

### 6.10 Lead Database
Virtualized table (server-side sort/filter/search/pagination), saved views, bulk actions, column config,
slide-out detail (timeline, screenshot, AI report, notes, activity, tasks, campaigns).
**AC:** 100k rows scroll smoothly; any column filterable/sortable; a filtered set is one click to a sequence.

### 6.11 CRM + Kanban
Stages New→Research→Contacted→Meeting→Proposal→Negotiation→Won→Lost; drag-drop; deals, tasks, meetings,
calendar, notes, activity timeline.
**AC:** Moving a card writes an activity + can trigger a workflow.

### 6.12 Campaigns (Sequences)
Multi-step email sequences, AI writing + personalization from audit findings, A/B, open/click/reply tracking,
per-user connected mailbox (Gmail/Outlook/SMTP), unsubscribe + suppression list.
**AC:** A sequence sends from the user's mailbox, personalizes per lead, and records events; replies pause the sequence.

### 6.13 Automation / Workflow Engine
Trigger → condition → action graph ("IF website broken THEN wait 3d → email → if no reply → follow-up → notify rep → create task").
**AC:** A published workflow executes reliably via the queue with visible run logs.

### 6.14 AI Assistant
Natural-language querying of the user's own data + guided discovery ("find salons with outdated sites near me").
**AC:** NL query maps to a real, safe filter/discovery action scoped to the org; no cross-tenant leakage.

### 6.15 Integrations
HubSpot, Salesforce, Pipedrive, Zoho, Slack/Discord, Google Sheets, Airtable, Zapier/n8n, Gmail/Outlook/SMTP,
Twilio/WhatsApp, OpenAI/Claude/Gemini keys (BYO).
**AC (v1 subset):** Slack notify, Google Sheets export, Gmail/Outlook send, Zapier webhook out.

### 6.16 Admin & Security
Orgs/teams, RBAC, invitations, audit logs, usage metering, encryption at rest for secrets, SSO-ready.
**AC:** Every write action is attributable; secrets are encrypted; roles gate every mutation.

## 7. Success metrics (North-Star & guardrails)

- **North-Star:** *Qualified opportunities delivered per active org per week* (lead with verified contact + audit + score ≥ threshold).
- **Activation:** % of new orgs that reach "first sequence sent" within 7 days.
- **Value proof:** reply rate on audit-hooked emails vs. control.
- **Retention:** week-4 org retention; discoveries/org/week trend.
- **Guardrail:** bounce rate < 3%, spam-complaint rate < 0.1%, zero cross-tenant data incidents.

## 8. Constraints, risks & assumptions

| Risk | Mitigation |
|---|---|
| Scraping ToS / legal exposure | API-first; robots.txt respected; audit fetches target's *own* public pages; per-source policy engine ([Doc 10](./10-scraper-architecture.md)) |
| Email deliverability / blacklisting | BYO-mailbox only, no shared IP pools; warmup guidance; suppression + unsubscribe enforced; verification gate before send |
| AI hallucinating metrics | LLM never sources numbers — only narrates deterministic audit output |
| Provider cost blowups | Per-org usage metering + hard caps + caching of audits (TTL) |
| Data freshness | Re-audit scheduling; `fetchedAt` provenance on every field |
| PII / GDPR | Lawful-basis config per campaign, data-subject delete, EU data residency option (post-MVP) |

## 9. Release definition of done (v1 / MVP)

An agency can: sign up → create org → define one ICP → get ≥ 50 discovered + audited + scored leads → filter to
a shortlist → connect Gmail → send a personalized 3-step sequence → track replies → move winners across a
Kanban — with roles, audit log, and usage limits enforced. Full phasing in [Doc 16](./16-roadmap.md).
