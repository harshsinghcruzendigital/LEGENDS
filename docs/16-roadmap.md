# 16 — Roadmap (MVP → Scale)

Honest phasing with effort signals. Estimates assume a small senior team (2–3 full-stack + 1 AI/data eng, or a
very determined solo founder moving slower). "Weeks" are elapsed, not ideal.

## Phase 0 — Foundations (weeks 1–3)
**Goal:** the skeleton everything hangs on.
- Monorepo (Turbo), `packages/db` Prisma schema (Doc 04) + migrations + seed.
- Auth + orgs + memberships + RBAC guards + RLS (Doc 14). Multi-tenancy proven with tests.
- App shell: sidebar, topbar, theme, `@leadgen/ui` base + glass tokens (Doc 13), command palette.
- CI/CD, docker-compose dev, health checks, error/observability wiring (Doc 15).
**Exit:** a user can sign up, create an org, invite a teammate with a role, and see an empty, beautiful shell.

## Phase 1 — The core loop / MVP (weeks 4–10)
**Goal:** the thing that makes someone say "whoa." Ships the PRD §9 DoD.
- **Discovery** (Google Places + SERP) → Candidates → dedupe (Doc 10).
- **Website Scanner**: render svc (Playwright+Lighthouse+SSL+tech+screenshot) → `WebsiteAudit` + findings.
- **UI Vision Analyst** + **Audit Narrator** (Doc 09) → scores + report + email hook.
- **Lead Database** (virtualized grid, Filter DSL, saved views, slide-over detail).
- **Scoring** rubric engine → 0–100 explainable.
- **Enrichment** (one contact provider) + **Email Verification** (one provider).
- **Campaigns** MVP: connect Gmail/Outlook, 3-step sequence, AI copy, open/click/reply tracking, suppression/unsub.
- **Kanban + basic CRM** (deals, tasks, notes, activity).
- **Billing** (Stripe) + **usage metering** + plan caps (Doc 17).
- Public shareable report `/r/:publicId` (the growth loop).
**Exit:** an agency runs discovery → gets audited/scored leads → sends a personalized sequence → tracks replies. **This is launchable.**

## Phase 2 — Depth & automation (weeks 11–18)
- **Automation/Workflow engine** (visual builder, Doc 12).
- **App Scanner** (Play/App Store) + **Maps Finder** full UX + **Marketplace Discovery** (1–2 marketplaces).
- **AI Assistant** (NL→Filter, tool-use, confirmed writes) (Doc 09 §2.5).
- **AI Insights** (trends, opportunity heatmaps, suggested ICPs).
- **Enrichment waterfall** (multi-provider + reconciler) + decision-maker discovery.
- **Integrations** wave 1: Slack, Google Sheets, Zapier, HubSpot.
- **Unified inbox** for replies; A/B testing; deliverability tooling (warmup guidance).
- Scheduled/recurring ICPs + re-audit freshness sweeps.

## Phase 3 — Scale & enterprise (weeks 19–30+)
- **Scale infra**: EKS + KEDA worker autoscaling, OpenSearch, read replicas, partition maturity (Doc 15).
- **Enterprise**: SSO/SAML + SCIM, audit-log export, data residency (EU), advanced RBAC/teams, DPA.
- Integrations wave 2: Salesforce, Pipedrive, Zoho, Outlook adv., Twilio/WhatsApp, n8n, Airtable, Discord.
- **Chrome extension** capture inbox (Doc 10 §9).
- Public **developer API** + webhooks (Doc 08 §4) + marketplace of ICP templates.
- Advanced deliverability (inbox rotation *within the user's own mailboxes*, spam-testing), reporting/white-label.

## Phase 4 — Compounding AI (post-GA, ongoing)
- Self-tuning scoring from won/lost feedback (which opportunity types actually close for *this* org).
- Auto-generated audit → proposal → SOW draft ("here's the fix, here's the quote").
- Predictive "best time / best angle" outreach; reply-intent classification + auto-draft responses (human-approved).
- Vertical ICP packs (dental, restaurants, Shopify home-goods…) with tuned rubrics.
- Agentic "pipeline autopilot": define outcomes, the system runs discovery→audit→outreach→booking within guardrails.

---

## Two build tracks (pick per your reality)

**Lean solo track:** Phase 0 + a *thin* Phase 1 (Places-only discovery, one enrichment + one verify provider,
Gmail-only sending, no workflow engine). ~6–8 weeks to a demoable, sellable tool. Sell it, fund the rest.

**Funded team track:** Phases 0–2 in ~4–5 months to a competitive product; Phase 3 for enterprise deals.

## Dependency notes (what unblocks what)
- Everything depends on **Phase 0 tenancy** — don't shortcut RLS/RBAC; retrofitting is brutal.
- Campaigns depend on **verification** (don't send to unverified) and **mailbox OAuth**.
- Automation depends on the **event bus** (Doc 05 §5) existing first.
- Scale (Phase 3) is demand-driven — don't build EKS/OpenSearch before load requires it.
