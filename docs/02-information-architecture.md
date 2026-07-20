# 02 — Information Architecture

How the product is organized: the navigation model, every screen, and the URL map. This is the contract the
frontend (Doc 06) and API (Doc 08) both build against.

---

## 1. Navigation model

Three navigation surfaces:

1. **Primary sidebar** (persistent, collapsible) — the module switcher.
2. **Contextual top bar** — org/workspace switcher, global search (⌘K), AI assistant launcher, notifications, help, avatar menu.
3. **Command palette (⌘K)** — jump-to-anything + AI actions ("discover salons in Austin", "verify selected emails").

Everything lives under an authenticated `/app` shell except marketing, auth, and public shareable reports.

## 2. URL map

```
PUBLIC / UNAUTH
/                              Marketing landing
/pricing                      Plans (mirrors Doc 17)
/login  /signup  /forgot      Auth
/invite/:token                Accept team invite
/r/:publicId                  Public shareable audit report (branded, no auth)  ← the growth loop

AUTHENTICATED SHELL  (/app, requires session + active org)
/app                          Redirect → /app/dashboard
/app/dashboard                Global Dashboard (KPIs, charts, recent, AI recs)

  DISCOVERY
/app/discovery                Lead Discovery Engine (source picker + query builder)
/app/discovery/runs           Discovery run history + status
/app/discovery/runs/:id       Single run detail (candidates found, dedupe, queued audits)
/app/maps                     Maps Finder
/app/marketplace              Marketplace Discovery
/app/apps                     App Scanner (Play/App Store)
/app/scanner                  Website Scanner (single/bulk URL audit)
/app/chrome                   Chrome Discovery (extension companion / capture inbox)

  DATA
/app/leads                    Lead Database (table + saved views)
/app/leads/:id                Lead detail (also opens as slide-over from table)
/app/enrichment               Enrichment center (jobs, credits, provider status)
/app/verification             Email Verification center

  WORK
/app/crm                      CRM home (pipeline overview)
/app/crm/board                Kanban board
/app/crm/deals/:id            Deal detail
/app/crm/calendar             Calendar (tasks + meetings)
/app/campaigns                Campaigns list
/app/campaigns/:id            Sequence builder + analytics
/app/inbox                    Unified reply inbox (per connected mailbox)
/app/automation               Workflow list
/app/automation/:id           Visual workflow builder (canvas)

  INTELLIGENCE
/app/insights                 AI Insights (trends, cohorts, opportunity heatmaps)
/app/assistant                AI Chat Assistant (full-page; also a slide-over anywhere)

  PLATFORM
/app/integrations             Integrations catalog + connections
/app/settings                 Settings root → /app/settings/profile
/app/settings/profile         Personal profile
/app/settings/organization    Org profile, branding (for reports/emails)
/app/settings/team            Members, roles, invitations
/app/settings/billing         Plan, usage, invoices (Doc 17)
/app/settings/api-keys        BYO AI keys + platform API tokens
/app/settings/mailboxes       Connected sending mailboxes + domains
/app/settings/notifications   Notification prefs
/app/settings/audit-log       Audit log viewer

  ADMIN  (platform-staff only, separate RBAC scope)
/admin                        Ops dashboard (tenants, usage, provider spend)
/admin/orgs                   All organizations
/admin/orgs/:id               Tenant detail + impersonation (audited)
/admin/providers              Provider health + cost dashboards
/admin/queues                 BullMQ board (jobs, failures, retries)
/admin/flags                  Feature flags / plan gates
/admin/audit                  Global audit log
```

## 3. Screen inventory (grouped)

Each screen lists its **purpose**, **key regions**, and **primary actions**. Full visual specs live in
Doc 13 (Design System) and the per-page design doc.

### 3.1 Global Dashboard — `/app/dashboard`
- **Purpose:** at-a-glance state of the pipeline + AI-surfaced next actions.
- **KPI row (glass stat tiles):** Total Leads · Today's Leads · Qualified Leads · Broken Websites · Poor-UI Websites · App Opportunities · Emails Verified · Phone Numbers · Companies · Countries · Conversion % · Potential Revenue · Pipeline Value.
- **Charts:** Leads growth (area, 30/90d) · Discovery-source breakdown (bar) · Opportunity-type distribution (donut) · Geo heatmap (leads by country/state) · Score distribution histogram.
- **Feeds:** Recent discoveries (live) · AI Recommendations ("18 leads score ≥80 and are unassigned — start a sequence?") · Tasks due today.
- **Actions:** New Discovery · Ask AI · Jump to filtered view.

### 3.2 Lead Discovery — `/app/discovery`
- **Purpose:** define *what* to find and *where*.
- **Regions:** Source multi-select (grouped: Search · Maps · Marketplaces · App Stores · Social · Directories · Platform-detected) · Filter builder (industry, geo cascade country→state→city→zip, category, keywords, tech/CMS/hosting, employees, revenue, traffic, language) · ICP save/load · Estimated-results preview · Schedule (one-off / recurring).
- **Actions:** Run now · Save as ICP · Schedule.
- **Output:** creates a **Discovery Run** → candidates → dedupe → audit queue.

### 3.3 Discovery Runs — `/app/discovery/runs[/:id]`
- Run list with status (queued/running/enriching/done/failed), counts, source mix, duration.
- Detail: pipeline stages with progress, candidates table, dedupe report, errors, "promote to leads".

### 3.4 Maps Finder — `/app/maps`
- Map + list split view; keyword + radius + category; result cards (name, rating, reviews, category, website?, phone?); bulk "audit + enrich + add to leads".

### 3.5 Marketplace Discovery — `/app/marketplace`
- Marketplace picker (Amazon/Flipkart/Etsy/…); product query; brand-resolution results; "resolve official site + enrich".

### 3.6 App Scanner — `/app/apps`
- Input: store URL / package id / keyword search; results with rating, ratings count, last-updated, staleness flag, opportunity score; open → App Audit panel (sentiment, screenshot critique).

### 3.7 Website Scanner — `/app/scanner`
- Single or bulk URL(s) / paste list / upload CSV; live audit progress; **WebsiteAudit report** (sub-scores, findings with severity + evidence, screenshot, tech stack); "Save as lead", "Share public report".

### 3.8 Chrome Discovery — `/app/chrome`
- Companion for the browser extension: a capture inbox of pages the user flagged while browsing, queued for audit/enrich. (Extension = post-MVP; page exists as the inbox.)

### 3.9 Lead Database — `/app/leads`
- Virtualized data grid (columns per PRD §6.10). Left rail: saved views + smart segments. Top: filter chips, search, column config, bulk-action bar (assign, tag, add to sequence, enrich, verify, export, change status).
- Row click → **slide-over Lead Detail** (does not lose table context).

### 3.10 Lead Detail — `/app/leads/:id` (page + slide-over)
- Tabs: **Overview** (screenshot, scores, opportunity summary) · **Audit** (full website + UI + app reports) · **Contacts** (people, emails w/ verification badge, phones, socials) · **Firmographics** · **Timeline/Activity** · **Notes** · **Tasks** · **Campaigns** (which sequences it's in) · **Communication** (email thread).
- Actions: assign, change stage, enrich, verify, add to sequence, create task, share report.

### 3.11 Enrichment Center — `/app/enrichment`
- Job queue, provider status + credits remaining, per-field provenance viewer, re-enrich scheduling.

### 3.12 Verification Center — `/app/verification`
- Bulk paste/upload; results with status + confidence; export; suppression management.

### 3.13 CRM — `/app/crm`, `/board`, `/deals/:id`, `/calendar`
- Pipeline overview (value per stage, aging) · Kanban (drag-drop stages) · Deal detail (value, contacts, activities, files) · Calendar (tasks + meetings, day/week/month).

### 3.14 Campaigns — `/app/campaigns[/:id]`
- List (status, sent, open/click/reply rates) · Builder (steps, delays, A/B variants, AI-write per step, personalization tokens incl. audit findings, sending mailbox, schedule/throttle) · Analytics (funnel + per-step + per-variant).

### 3.15 Inbox — `/app/inbox`
- Unified replies across connected mailboxes; thread view; reply; convert to task/deal; sentiment tag.

### 3.16 Automation — `/app/automation[/:id]`
- Workflow list (status, runs, success rate) · Canvas builder (trigger node → condition/branch → action nodes) · Run logs.

### 3.17 AI Insights — `/app/insights`
- Trend charts, opportunity heatmaps (industry × geo × severity), cohort analysis, "where your best leads come from", suggested new ICPs.

### 3.18 AI Assistant — `/app/assistant` (+ global slide-over)
- Chat over the org's own data + guided discovery + action execution (with confirm for writes). Tool-use surfaced as visible steps.

### 3.19 Integrations — `/app/integrations`
- Catalog cards (connected/available), per-integration config, sync status, logs.

### 3.20 Settings — `/app/settings/*`
- Profile, Organization + branding, Team + roles, Billing + usage, API keys (BYO AI + platform tokens), Mailboxes + domains, Notifications, Audit log.

### 3.21 Admin — `/admin/*` (staff)
- Tenants, provider health/spend, queue board, feature flags, global audit. Impersonation is possible but **always audit-logged and banner-flagged**.

## 4. Cross-cutting UI patterns

- **Slide-over detail panels** (leads, deals) preserve list context — never a full nav away for a quick look.
- **Saved views / segments** are first-class across Leads, Campaigns, Discovery.
- **Bulk-action bar** appears on any multi-select surface with identical grammar (assign/tag/enrich/verify/sequence/export/delete).
- **Everything auditable** writes an activity to the lead/deal timeline and, if sensitive, to the audit log.
- **Empty states teach:** every list's empty state links to the action that fills it (e.g., Leads empty → "Run your first discovery").
- **The public report `/r/:publicId`** is the viral surface: branded, fast, shareable — it's how prospects (and their friends) discover the tool.

## 5. Responsive behavior

- **≥1280px:** full sidebar + multi-pane (map+list, table+slide-over, canvas).
- **768–1279px:** sidebar collapses to icons; slide-overs become full-height sheets.
- **<768px:** bottom-nav for the 5 core modules (Dashboard, Leads, Discovery, CRM, Assistant); tables become stacked cards; builders are view-only with an "edit on desktop" nudge.

## 6. Navigation → module → API → data (traceability)

| Sidebar item | Route | Primary API surface (Doc 08) | Core tables (Doc 04) |
|---|---|---|---|
| Dashboard | `/app/dashboard` | `metrics.*` | `Lead`, `Activity`, `Deal` |
| Lead Discovery | `/app/discovery` | `discovery.*` | `DiscoveryRun`, `Candidate`, `Icp` |
| Lead Database | `/app/leads` | `leads.*` | `Lead`, `Contact`, `WebsiteAudit`, `UiAudit` |
| Maps Finder | `/app/maps` | `discovery.maps.*` | `Candidate`, `Business` |
| Website Scanner | `/app/scanner` | `audit.website.*` | `WebsiteAudit`, `AuditFinding` |
| App Scanner | `/app/apps` | `audit.app.*` | `AppAudit` |
| Marketplace | `/app/marketplace` | `discovery.marketplace.*` | `Candidate`, `Brand` |
| Chrome Discovery | `/app/chrome` | `capture.*` | `Candidate` |
| Email Verification | `/app/verification` | `verify.*` | `EmailVerification` |
| AI Insights | `/app/insights` | `insights.*` | materialized views |
| Campaigns | `/app/campaigns` | `campaigns.*` | `Campaign`, `Sequence`, `Message`, `Event` |
| Automation | `/app/automation` | `workflows.*` | `Workflow`, `WorkflowRun` |
| CRM | `/app/crm` | `crm.*` | `Deal`, `Task`, `Meeting`, `Note`, `Activity` |
| Integrations | `/app/integrations` | `integrations.*` | `Integration`, `IntegrationEvent` |
| Settings | `/app/settings` | `org.*`, `user.*`, `billing.*` | `Org`, `User`, `Membership`, `Subscription` |
| Admin | `/admin` | `admin.*` | all (staff-scoped) |
