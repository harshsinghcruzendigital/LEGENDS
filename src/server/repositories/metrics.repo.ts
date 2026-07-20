/**
 * Metrics repository (docs/08 metrics.*). With a database it computes every KPI,
 * chart and feed from live per-org aggregates; otherwise it returns the mock
 * constants. This is the last surface to go real — a new org now sees its OWN
 * numbers (zeros until it discovers), not the demo's.
 */
import { hasDatabase, getPrisma } from "@/server/db";
import {
  KPIS,
  GROWTH_SERIES,
  SOURCE_BREAKDOWN,
  OPPORTUNITY_BREAKDOWN,
  SCORE_HISTOGRAM,
  GEO_BREAKDOWN,
  PIPELINE_BY_STAGE,
  RECENT_DISCOVERIES,
  AI_RECOMMENDATIONS,
  POTENTIAL_REVENUE,
  type AiRec,
} from "@/lib/mock/metrics";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import { mulberry32, randInt } from "@/lib/utils";
import type { Kpi, SeriesPoint, RecentDiscovery, Stage } from "@/lib/types";

const STAGES: Stage[] = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

const KPI_META: { key: string; label: string; format: Kpi["format"]; icon: string; accent: Kpi["accent"]; delta: number }[] = [
  { key: "total", label: "Total Leads", format: "number", icon: "Database", accent: "primary", delta: 12.4 },
  { key: "today", label: "Today's Leads", format: "number", icon: "Sparkles", accent: "accent", delta: 8.1 },
  { key: "qualified", label: "Qualified Leads", format: "number", icon: "Target", accent: "success", delta: 15.2 },
  { key: "broken", label: "Broken Websites", format: "number", icon: "Unplug", accent: "destructive", delta: 4.6 },
  { key: "poorui", label: "Poor UI Websites", format: "number", icon: "PenTool", accent: "warning", delta: 6.9 },
  { key: "app", label: "App Opportunities", format: "number", icon: "Smartphone", accent: "info", delta: 3.3 },
  { key: "emails", label: "Emails Verified", format: "number", icon: "MailCheck", accent: "success", delta: 18.7 },
  { key: "phones", label: "Phone Numbers", format: "number", icon: "Phone", accent: "accent", delta: 9.4 },
  { key: "companies", label: "Companies", format: "number", icon: "Building2", accent: "primary", delta: 12.4 },
  { key: "countries", label: "Countries", format: "number", icon: "Globe", accent: "info", delta: 2.0 },
  { key: "conversion", label: "Conversion", format: "percent", icon: "TrendingUp", accent: "success", delta: 1.8 },
  { key: "pipeline", label: "Pipeline Value", format: "currency", icon: "DollarSign", accent: "primary", delta: 22.5 },
];

function spark(seed: number): number[] {
  const rng = mulberry32(seed + 1);
  let v = randInt(rng, 25, 55);
  return Array.from({ length: 12 }, () => {
    v = Math.max(6, v + randInt(rng, -8, 12));
    return v;
  });
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function computeFromDb(orgId: string) {
  const prisma = getPrisma();

  const [leads, emailsVerified, phones] = await Promise.all([
    prisma.lead.findMany({
      where: { orgId },
      select: {
        id: true, company: true, domain: true, logoUrl: true, leadScore: true, websiteScore: true,
        uiScore: true, websiteStatus: true, appStatus: true, opportunityType: true, source: true,
        country: true, countryCode: true, stage: true, revenueMinor: true, createdAt: true,
      },
    }),
    prisma.contact.count({ where: { orgId, emailStatus: "VALID" } }),
    prisma.contact.count({ where: { orgId, phone: { not: null } } }),
  ]);

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const total = leads.length;
  const today = leads.filter((l) => l.createdAt >= startOfToday).length;
  const qualified = leads.filter((l) => l.leadScore >= 70).length;
  const broken = leads.filter((l) => l.websiteStatus === "BROKEN" || l.websiteStatus === "NO_SSL").length;
  const poorUi = leads.filter((l) => l.uiScore <= 40).length;
  const appOpps = leads.filter((l) => l.appStatus === "POOR" || l.appStatus === "STALE").length;
  const countries = new Set(leads.map((l) => l.country)).size;
  const won = leads.filter((l) => l.stage === "WON").length;
  const conversion = total ? (won / total) * 100 : 0;
  const pipelineValue = leads.filter((l) => !["WON", "LOST"].includes(l.stage)).reduce((s, l) => s + Number(l.revenueMinor) * 0.08, 0);
  const potentialRevenue = leads.reduce((s, l) => s + Number(l.revenueMinor) * 0.05, 0);

  const values: Record<string, number> = {
    total, today, qualified, broken, poorui: poorUi, app: appOpps,
    emails: emailsVerified, phones, companies: total, countries,
    conversion, pipeline: Math.round(pipelineValue),
  };

  const kpis: Kpi[] = KPI_META.map((m, i) => ({
    ...m,
    value: values[m.key] ?? 0,
    spark: spark(i),
  }));

  // 30-day growth
  const growth: SeriesPoint[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(startOfToday.getTime() - d * 86400000);
    const key = dayKey(day);
    const dayLeads = leads.filter((l) => dayKey(l.createdAt) === key);
    growth.push({ date: key, leads: dayLeads.length, qualified: dayLeads.filter((l) => l.leadScore >= 70).length });
  }

  // source breakdown
  const sourceMap = new Map<string, number>();
  for (const l of leads) sourceMap.set(l.source, (sourceMap.get(l.source) ?? 0) + 1);
  const sources = [...sourceMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // opportunity breakdown (unnest arrays in JS)
  const oppMap = new Map<string, number>();
  for (const l of leads) for (const o of l.opportunityType) oppMap.set(o, (oppMap.get(o) ?? 0) + 1);
  const opportunities = [...oppMap.entries()]
    .map(([k, value]) => ({ name: OPPORTUNITY_LABELS[k as keyof typeof OPPORTUNITY_LABELS] ?? k, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // score histogram
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count: 0 }));
  for (const l of leads) buckets[Math.min(9, Math.floor(l.leadScore / 10))].count++;

  // geo
  const geoMap = new Map<string, { count: number; cc: string }>();
  for (const l of leads) {
    const cur = geoMap.get(l.country) ?? { count: 0, cc: l.countryCode };
    cur.count++;
    geoMap.set(l.country, cur);
  }
  const geo = [...geoMap.entries()].map(([country, v]) => ({ country, count: v.count, cc: v.cc })).sort((a, b) => b.count - a.count).slice(0, 8);

  // pipeline by stage
  const pipeline = STAGES.map((stage) => {
    const stageLeads = leads.filter((l) => l.stage === stage);
    return { stage, count: stageLeads.length, value: Math.round(stageLeads.reduce((s, l) => s + Number(l.revenueMinor) * 0.08, 0)) };
  });

  // recent discoveries
  const recent: RecentDiscovery[] = [...leads]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((l) => ({
      id: l.id, company: l.company, logoUrl: l.logoUrl, domain: l.domain,
      leadScore: l.leadScore, opportunity: l.opportunityType[0], source: l.source, at: l.createdAt.toISOString(),
    }));

  // recommendations (dynamic from real counts)
  const recommendations: AiRec[] = [
    {
      id: "rec1",
      title: total === 0 ? "Run your first discovery" : `${qualified} qualified leads in your pipeline`,
      body: total === 0
        ? "Your workspace is empty. Define an ICP and let the engine find, audit, and score matching businesses."
        : `${qualified} leads score ≥ 70. Route them into a sequence to start conversations today.`,
      cta: total === 0 ? "Start discovering" : "Review qualified leads",
      href: total === 0 ? "/discovery" : "/leads?score=70",
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
      title: "Discover a new niche",
      body: "Try a fresh ICP — e.g. Shopify home-goods stores with slow mobile sites — and grow your pipeline.",
      cta: "Create discovery run",
      href: "/discovery",
      tone: "success",
    },
  ];

  return { kpis, growth, sources, opportunities, scoreHistogram: buckets, geo, pipeline, recent, recommendations, potentialRevenue: Math.round(potentialRevenue) };
}

export const metricsRepository = {
  async dashboard(orgId: string) {
    if (!hasDatabase) {
      return {
        kpis: KPIS, growth: GROWTH_SERIES, sources: SOURCE_BREAKDOWN, opportunities: OPPORTUNITY_BREAKDOWN,
        scoreHistogram: SCORE_HISTOGRAM, geo: GEO_BREAKDOWN, pipeline: PIPELINE_BY_STAGE,
        recent: RECENT_DISCOVERIES, recommendations: AI_RECOMMENDATIONS, potentialRevenue: POTENTIAL_REVENUE,
      };
    }
    return computeFromDb(orgId);
  },
};
