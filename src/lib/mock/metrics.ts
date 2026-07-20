/** Dashboard metrics derived from the mock LEADS dataset (docs/02 §3.1 Global Dashboard). */
import type { Kpi, SeriesPoint, RecentDiscovery } from "@/lib/types";
import { LEADS } from "@/lib/mock/leads";
import { mulberry32, randInt } from "@/lib/utils";

const rng = mulberry32(77);

function spark(n = 12): number[] {
  let v = randInt(rng, 20, 60);
  return Array.from({ length: n }, () => {
    v = Math.max(6, v + randInt(rng, -8, 12));
    return v;
  });
}

const total = LEADS.length;
const qualified = LEADS.filter((l) => l.leadScore >= 70).length;
const broken = LEADS.filter((l) => l.websiteStatus === "BROKEN" || l.websiteStatus === "NO_SSL").length;
const poorUi = LEADS.filter((l) => l.uiScore <= 40).length;
const appOpps = LEADS.filter((l) => l.appStatus === "POOR" || l.appStatus === "STALE").length;
const emailsVerified = LEADS.reduce((s, l) => s + l.contacts.filter((c) => c.emailStatus === "VALID").length, 0);
const phones = LEADS.reduce((s, l) => s + l.contacts.filter((c) => c.phone).length, 0);
const countries = new Set(LEADS.map((l) => l.country)).size;
const won = LEADS.filter((l) => l.stage === "WON").length;
const pipelineValue = LEADS.filter((l) => !["WON", "LOST"].includes(l.stage)).reduce((s, l) => s + l.revenueMinor * 0.08, 0);
const potentialRevenue = LEADS.reduce((s, l) => s + l.revenueMinor * 0.05, 0);
const todaysLeads = LEADS.filter((l) => Date.parse(l.createdAt) > Date.parse("2026-07-17T12:00:00Z")).length;

export const KPIS: Kpi[] = [
  { key: "total", label: "Total Leads", value: total, format: "number", delta: 12.4, spark: spark(), icon: "Database", accent: "primary" },
  { key: "today", label: "Today's Leads", value: todaysLeads, format: "number", delta: 8.1, spark: spark(), icon: "Sparkles", accent: "accent" },
  { key: "qualified", label: "Qualified Leads", value: qualified, format: "number", delta: 15.2, spark: spark(), icon: "Target", accent: "success" },
  { key: "broken", label: "Broken Websites", value: broken, format: "number", delta: 4.6, spark: spark(), icon: "Unplug", accent: "destructive" },
  { key: "poorui", label: "Poor UI Websites", value: poorUi, format: "number", delta: 6.9, spark: spark(), icon: "PenTool", accent: "warning" },
  { key: "app", label: "App Opportunities", value: appOpps, format: "number", delta: 3.3, spark: spark(), icon: "Smartphone", accent: "info" },
  { key: "emails", label: "Emails Verified", value: emailsVerified, format: "number", delta: 18.7, spark: spark(), icon: "MailCheck", accent: "success" },
  { key: "phones", label: "Phone Numbers", value: phones, format: "number", delta: 9.4, spark: spark(), icon: "Phone", accent: "accent" },
  { key: "companies", label: "Companies", value: total, format: "number", delta: 12.4, spark: spark(), icon: "Building2", accent: "primary" },
  { key: "countries", label: "Countries", value: countries, format: "number", delta: 2.0, spark: spark(), icon: "Globe", accent: "info" },
  { key: "conversion", label: "Conversion", value: total ? (won / total) * 100 : 0, format: "percent", delta: 1.8, spark: spark(), icon: "TrendingUp", accent: "success" },
  { key: "pipeline", label: "Pipeline Value", value: Math.round(pipelineValue), format: "currency", delta: 22.5, spark: spark(), icon: "DollarSign", accent: "primary" },
];

export const POTENTIAL_REVENUE = Math.round(potentialRevenue);

/** 30-day growth series. */
export const GROWTH_SERIES: SeriesPoint[] = (() => {
  const out: SeriesPoint[] = [];
  let leads = 60;
  let qual = 22;
  const start = Date.parse("2026-06-19T00:00:00Z");
  for (let i = 0; i < 30; i++) {
    leads = Math.max(8, leads + randInt(rng, -6, 16));
    qual = Math.max(3, Math.min(leads, qual + randInt(rng, -4, 9)));
    out.push({
      date: new Date(start + i * 86400000).toISOString().slice(0, 10),
      leads,
      qualified: qual,
    });
  }
  return out;
})();

/** Leads grouped by discovery source. */
export const SOURCE_BREAKDOWN = Object.entries(
  LEADS.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

/** Opportunity-type distribution. */
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
export const OPPORTUNITY_BREAKDOWN = Object.entries(
  LEADS.reduce<Record<string, number>>((acc, l) => {
    for (const o of l.opportunityType) acc[o] = (acc[o] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([key, value]) => ({ name: OPPORTUNITY_LABELS[key as keyof typeof OPPORTUNITY_LABELS] ?? key, value }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 8);

/** Score distribution histogram (buckets of 10). */
export const SCORE_HISTOGRAM = (() => {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count: 0 }));
  for (const l of LEADS) buckets[Math.min(9, Math.floor(l.leadScore / 10))].count++;
  return buckets;
})();

/** Leads by country for the geo panel. */
export const GEO_BREAKDOWN = Object.entries(
  LEADS.reduce<Record<string, { count: number; cc: string }>>((acc, l) => {
    acc[l.country] = { count: (acc[l.country]?.count ?? 0) + 1, cc: l.countryCode };
    return acc;
  }, {}),
)
  .map(([country, v]) => ({ country, count: v.count, cc: v.cc }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);

export const PIPELINE_BY_STAGE = (["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const).map(
  (stage) => ({
    stage,
    count: LEADS.filter((l) => l.stage === stage).length,
    value: Math.round(LEADS.filter((l) => l.stage === stage).reduce((s, l) => s + l.revenueMinor * 0.08, 0)),
  }),
);

export const RECENT_DISCOVERIES: RecentDiscovery[] = [...LEADS]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, 8)
  .map((l) => ({
    id: l.id,
    company: l.company,
    logoUrl: l.logoUrl,
    domain: l.domain,
    leadScore: l.leadScore,
    opportunity: l.opportunityType[0],
    source: l.source,
    at: l.createdAt,
  }));

export interface AiRec {
  id: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone: "primary" | "success" | "warning";
}

export const AI_RECOMMENDATIONS: AiRec[] = [
  {
    id: "rec1",
    title: `${qualified} qualified leads are unassigned`,
    body: `You have ${qualified} leads scoring ≥ 70 with verified contacts. Route them to a sequence to start conversations today.`,
    cta: "Review qualified leads",
    href: "/leads?score=70",
    tone: "primary",
  },
  {
    id: "rec2",
    title: `${broken} broken websites detected`,
    body: "These are your highest-urgency opportunities — an audit teardown is the perfect cold-email hook.",
    cta: "Open broken-site segment",
    href: "/leads?status=broken",
    tone: "warning",
  },
  {
    id: "rec3",
    title: "New ICP suggestion: Shopify home-goods",
    body: "Your best-converting leads cluster in Home & Furniture on Shopify. Want to run discovery on that niche?",
    cta: "Create discovery run",
    href: "/discovery",
    tone: "success",
  },
];
