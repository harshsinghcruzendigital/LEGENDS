/**
 * AI Outreach Copywriter (docs/09 §2.4) — Milestone-4 deterministic stand-in.
 * Composes a personalized cold email grounded in the lead's top audit finding —
 * the "audit is the pitch" thesis. The real version routes through the AI Gateway;
 * the token shape and output contract are identical, so it's a drop-in swap.
 */
import type { Lead, AuditFinding } from "@/lib/types";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";

export type CopyVariant = "direct" | "consultative" | "curiosity";

export const VARIANTS: { key: CopyVariant; label: string; note: string }[] = [
  { key: "direct", label: "Direct", note: "Straight to the problem + offer" },
  { key: "consultative", label: "Consultative", note: "Helpful, advisory tone" },
  { key: "curiosity", label: "Curiosity", note: "Short, intrigue-driven" },
];

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

export function topFinding(lead: Lead): AuditFinding | undefined {
  return [...lead.websiteAudit.findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])[0];
}

export function primaryContact(lead: Lead) {
  return lead.contacts.find((c) => c.isPrimary) ?? lead.contacts[0];
}

function firstNameOf(lead: Lead): string {
  const c = primaryContact(lead);
  return c ? c.fullName.split(" ")[0] : "there";
}

/** Replace {{tokens}} in a template with the lead's real values. */
export function fillTokens(template: string, lead: Lead): string {
  const finding = topFinding(lead);
  const map: Record<string, string> = {
    firstName: firstNameOf(lead),
    company: lead.company,
    domain: lead.domain,
    city: lead.city,
    score: String(lead.websiteScore),
    finding: finding?.title.toLowerCase() ?? "a few conversion issues",
    opportunity: lead.opportunityType[0] ? OPPORTUNITY_LABELS[lead.opportunityType[0]] : "your website",
    sender: "Alex",
    senderOrg: "BrightPixel",
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] ?? `{{${k}}}`);
}

/** The distinct finding-specific hook line — the credible, demonstrable opener. */
function hookFor(lead: Lead): string {
  const f = topFinding(lead);
  const s = lead.websiteScore;
  switch (f?.code) {
    case "NO_SSL":
      return `${lead.domain} is loading without a valid SSL certificate, so browsers are flagging it as "Not secure" — which quietly kills trust before anyone reads a word.`;
    case "LCP_SLOW":
      return `${lead.domain} takes several seconds to render its main content on mobile — most visitors bounce before they ever see what you offer.`;
    case "NO_VIEWPORT":
      return `${lead.domain} isn't mobile-responsive — the layout breaks on phones, where the majority of your traffic actually is.`;
    case "MISSING_SCHEMA":
      return `${lead.domain} is missing the structured data and meta that Google rewards, so you're leaving easy search visibility on the table.`;
    case "BROKEN_ASSETS":
      return `I found broken images and dead links across ${lead.domain} — small things that make an otherwise good business look unmaintained.`;
    case "NO_ECOMM":
      return `${lead.company} clearly has demand, but ${lead.domain} has no way to actually transact online — that's revenue walking out the door.`;
    default:
      return `I ran a quick audit on ${lead.domain} and it scored ${s}/100 — there are a handful of fixable issues holding back conversions.`;
  }
}

/** Generate subject + body for a lead in a given tone. Deterministic. */
export function generateEmail(lead: Lead, variant: CopyVariant): { subject: string; body: string } {
  const name = firstNameOf(lead);
  const hook = hookFor(lead);

  if (variant === "curiosity") {
    return {
      subject: `quick note on ${lead.domain}`,
      body: `Hi ${name},\n\n${hook}\n\nI put together a short teardown showing exactly what to fix (and the likely impact). Want me to send it over?\n\n– Alex`,
    };
  }

  if (variant === "consultative") {
    return {
      subject: `${lead.company}'s website — a couple of things worth knowing`,
      body: `Hi ${name},\n\nI work with ${lead.industry.toLowerCase()} brands on their websites, and while looking at ${lead.company} I noticed something worth flagging.\n\n${hook}\n\nNone of it is hard to fix, and it usually pays for itself quickly. I'd be happy to walk you through a free audit of ${lead.domain} — no pitch, just the findings and what I'd prioritize.\n\nOpen to a 15-minute look?\n\nBest,\nAlex\nBrightPixel Agency`,
    };
  }

  // direct
  return {
    subject: `${lead.company} — your site scored ${lead.websiteScore}/100`,
    body: `Hi ${name},\n\n${hook}\n\nWe help ${lead.industry.toLowerCase()} businesses fix exactly this — usually a fast redesign that lifts conversions and trust. I already ran the full audit on ${lead.domain} and can show you the top 5 fixes ranked by impact.\n\nWorth a quick call this week?\n\n– Alex, BrightPixel Agency`,
  };
}

/** Default sequence step templates (tokenized) for new campaigns. */
export const DEFAULT_STEP_TEMPLATES: { subject: string; body: string; delayDays: number }[] = [
  {
    delayDays: 0,
    subject: "{{company}} — your website scored {{score}}/100",
    body: "Hi {{firstName}},\n\nI ran a quick audit on {{domain}} and noticed {{finding}}. We help {{opportunity}} — happy to share the full teardown.\n\nWorth a quick call?\n\n– {{sender}}",
  },
  {
    delayDays: 3,
    subject: "Re: {{company}} — the audit",
    body: "Hi {{firstName}},\n\nJust floating this back up. The teardown for {{domain}} is ready whenever you are — takes 10 minutes to walk through.\n\n– {{sender}}",
  },
  {
    delayDays: 5,
    subject: "Last note, {{firstName}}",
    body: "Hi {{firstName}},\n\nI'll close the loop here — but the offer to fix {{finding}} on {{domain}} stands. Just reply \"audit\" and I'll send it over.\n\n– {{sender}}",
  },
];
