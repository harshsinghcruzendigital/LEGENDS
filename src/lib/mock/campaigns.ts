/** Mock campaigns with sequences + funnel analytics (docs/04, docs/08 campaigns.*). */
import type { Campaign, CampaignStatus, SequenceStepDef } from "@/lib/types";
import { DEFAULT_STEP_TEMPLATES } from "@/lib/ai-copy";
import { mulberry32, randInt } from "@/lib/utils";

const rng = mulberry32(4242);
const BASE = Date.parse("2026-07-18T12:00:00Z");

function steps(count: number): SequenceStepDef[] {
  return Array.from({ length: count }, (_, i) => {
    const t = DEFAULT_STEP_TEMPLATES[i % DEFAULT_STEP_TEMPLATES.length];
    return {
      id: `step_${i}`,
      order: i,
      channel: "EMAIL" as const,
      delayDays: t.delayDays,
      subject: t.subject,
      body: t.body,
    };
  });
}

function funnel(enrolled: number) {
  const sent = Math.round(enrolled * (0.9 + rng() * 0.1));
  const delivered = Math.round(sent * (0.94 + rng() * 0.05));
  const opened = Math.round(delivered * (0.45 + rng() * 0.25));
  const clicked = Math.round(opened * (0.18 + rng() * 0.22));
  const replied = Math.round(opened * (0.08 + rng() * 0.14));
  return { enrolled, sent, delivered, opened, clicked, replied };
}

const DEFS: { name: string; status: CampaignStatus; audience: string; stepCount: number; enrolled: number; days: number }[] = [
  { name: "Broken Website Teardown", status: "ACTIVE", audience: "Website score ≤ 40 · US", stepCount: 3, enrolled: 48, days: 6 },
  { name: "Shopify Speed Fix", status: "ACTIVE", audience: "Shopify · slow LCP · Home & Furniture", stepCount: 3, enrolled: 32, days: 11 },
  { name: "No-SSL Trust Rescue", status: "PAUSED", audience: "Missing SSL · any industry", stepCount: 2, enrolled: 21, days: 18 },
  { name: "Restaurants → Online Ordering", status: "ACTIVE", audience: "Restaurants · no e-commerce", stepCount: 3, enrolled: 27, days: 4 },
  { name: "Outdated Design Refresh", status: "DRAFT", audience: "Outdated design · 5+ employees", stepCount: 3, enrolled: 0, days: 1 },
  { name: "App Rating Turnaround", status: "COMPLETED", audience: "Play Store · rating ≤ 3.0", stepCount: 2, enrolled: 40, days: 30 },
];

export const CAMPAIGNS: Campaign[] = DEFS.map((d, i) => ({
  id: `cmp_${String(i + 1).padStart(3, "0")}`,
  name: d.name,
  status: d.status,
  mailbox: "alex@brightpixel.agency",
  audience: d.audience,
  createdAt: new Date(BASE - d.days * 86400000 - randInt(rng, 0, 86400000)).toISOString(),
  steps: steps(d.stepCount),
  stats: d.status === "DRAFT" ? { enrolled: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0 } : funnel(d.enrolled),
}));

export function getCampaign(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

export function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
