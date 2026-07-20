# 17 — Pricing & Packaging

## 1. Pricing philosophy

- **Value metric = qualified opportunities**, not seats alone. The thing that costs *us* money (discoveries,
  audits, enrichment, verification, AI tokens, emails) is metered as **credits**; seats are a secondary lever.
- **Land with the wedge:** a generous-enough free/starter tier so an agency *feels* the "whoa, real broken sites"
  moment before paying — that moment is the conversion event.
- **Costs are real:** every plan's included credits are sized against actual provider + AI + render cost so
  gross margin stays healthy. Hard caps + caching (Doc 09 §4, Doc 15 §8) protect us from runaway bills.

## 2. The credit model

One **credit** ≈ one unit of expensive work. Actions consume credits (tuned at launch against real cost):

| Action | ~Credits |
|---|---|
| Discovery result (candidate found) | 1 |
| Website audit (Lighthouse + tech + screenshot) | 3 |
| UI vision scoring | 2 |
| App audit | 2 |
| Enrichment (per successful provider hit) | 2 |
| Email verification | 1 |
| AI copy generation (per message) | 1 |
| AI Assistant (per 1k tokens) | metered to token budget |

Emails **sent** are limited separately (per-mailbox daily caps + monthly plan send limit) since they ride the
user's own mailbox. Unused credits roll over one cycle (soft cap) on paid plans.

## 3. Plans

| | **Free** | **Starter** | **Growth** | **Scale** | **Enterprise** |
|---|---|---|---|---|---|
| Price (mo, billed yearly) | $0 | $49 | $149 | $399 | Custom |
| Seats | 1 | 2 | 5 | 15 | Custom |
| Monthly credits | 200 | 3,000 | 12,000 | 40,000 | Custom pool |
| Leads stored | 200 | 5,000 | 50,000 | 250,000 | Unlimited* |
| Sending mailboxes | 1 | 2 | 5 | 15 | Custom |
| Monthly email sends | 100 | 2,000 | 10,000 | 40,000 | Custom |
| Website + UI audits | ✅ (capped) | ✅ | ✅ | ✅ | ✅ |
| App + Marketplace + Maps | Maps only | ✅ | ✅ | ✅ | ✅ |
| Enrichment + verification | trial | ✅ | ✅ | ✅ | ✅ |
| AI Assistant | limited | ✅ | ✅ | ✅ | ✅ |
| Automation/workflows | – | 1 workflow | 10 | unlimited | unlimited |
| Integrations | Sheets/Slack | + HubSpot/Zapier | all wave-1 | all | all + custom |
| Saved views / ICPs | 1 | 5 | 25 | unlimited | unlimited |
| Public branded reports | watermark | ✅ | ✅ | white-label | white-label |
| BYO AI keys | – | ✅ | ✅ | ✅ | ✅ |
| RBAC roles | basic | basic | full | full | full + custom |
| SSO/SAML + SCIM | – | – | – | add-on | ✅ |
| Audit log retention | 7d | 30d | 90d | 1y | custom |
| Support | community | email | priority | priority + Slack | dedicated + SLA |
| Data residency (EU) | – | – | – | – | ✅ |

\*fair-use. **Add-ons:** extra credit packs, extra mailboxes, extra seats, SSO (Scale), white-label, dedicated egress.

## 4. Metering & enforcement (how it actually works)

- Every metered action writes a `UsageEvent` (Doc 04 §10). The **UsageGuard** (Doc 05 §3) checks remaining
  quota *before* enqueuing metered work.
- **Soft warning at 80%**, **hard stop at 100%** with a clear upgrade CTA; in-flight jobs finish.
- `usage.current` / `usage.limits` power a live **UsageMeter** component (Doc 13) in the top bar + billing page.
- BYO-AI-keys mode moves AI token cost to the customer (their Anthropic/OpenAI key) → they get a lower effective price; we still meter for fair use.
- Overages: either hard-cap (default, safest for the user's wallet) or opt-in metered overage billing.

## 5. Billing implementation

- **Stripe** subscriptions + metered usage items; `Subscription` mirrors Stripe state via webhook (Doc 08 §4).
- Annual (2 months free) vs monthly; proration on upgrade; **14-day Growth trial**, no card for Free.
- Dunning: `past_due` → grace period + banners → feature soft-lock (reads stay, writes/sends pause) → suspend. Never delete data on downgrade — archive beyond new limits, restore on re-upgrade.
- Self-serve upgrade/downgrade + Stripe customer portal for invoices/cards.

## 6. Packaging rationale (why these lines)

- **Free** exists to deliver the wedge moment (audited broken sites) and to fuel the public-report growth loop (watermarked reports = distribution).
- **Starter** = solo freelancer/small agency who just needs a steady trickle of great leads + basic sending.
- **Growth** = the core ICP (small agency/team) — automation + full integrations + real volume. This is the tier we design the product *for*.
- **Scale** = multi-rep sales teams / larger agencies — seats, volume, white-label, add-on SSO.
- **Enterprise** = compliance/SSO/residency/SLA buyers — custom pool, dedicated support.

## 7. Unit-economics guardrails (build these into launch)

- Track **gross margin per org** = revenue − (provider spend + AI + render + email infra) from `UsageEvent` cost tags.
- Alert if any org's credit consumption implies negative margin (usually BYO-key opt-out on heavy AI use) → nudge to BYO keys or higher tier.
- Cache-hit rate on audits/vision is the #1 margin lever — monitor it (Doc 15 §8).
