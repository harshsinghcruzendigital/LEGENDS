/**
 * Scanner repository — runs a REAL website audit and persists the result as a lead
 * in the caller's org (upsert by domain). This is the first genuinely real data in
 * the product: paste a URL, get measured scores, saved as a workable lead.
 */
import { Prisma } from "@prisma/client";
import { hasDatabase, getPrisma } from "@/server/db";
import { auditWebsite, runPageSpeed, type AuditResult } from "@/server/services/website-audit";
import { leadCreateData } from "@/server/repositories/discovery.repo";
import { leadsRepository } from "@/server/repositories/leads.repo";
import type { Lead, OpportunityType, WebsiteStatus, ScoreFactor, WebsiteAudit } from "@/lib/types";

function companyFromDomain(domain: string): string {
  const root = domain.split(".")[0];
  const name = root.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return name || domain;
}

function opportunitiesFrom(a: AuditResult): OpportunityType[] {
  const set = new Set<OpportunityType>();
  for (const f of a.findings) {
    if (f.code === "NO_SSL") set.add("NO_SSL");
    else if (f.code === "NO_VIEWPORT") set.add("NOT_RESPONSIVE");
    else if (f.code === "SLOW") set.add("SLOW");
    else if (f.code === "HTTP_ERROR") set.add("BROKEN_SITE");
    else if (["NO_TITLE", "NO_META", "NO_SCHEMA"].includes(f.code)) set.add("SEO");
  }
  if (set.size === 0 && a.overallScore < 60) set.add("DIGITAL_TRANSFORM");
  return [...set].slice(0, 3);
}

function websiteStatusFrom(a: AuditResult): WebsiteStatus {
  if (!a.reachable || a.statusCode >= 400) return "BROKEN";
  if (!a.sslValid) return "NO_SSL";
  if (a.perfScore < 40) return "SLOW";
  return "ONLINE";
}

/** Build a full frontend Lead from a real audit. */
export function buildLeadFromAudit(a: AuditResult, id: string): Lead {
  const now = new Date().toISOString();
  const modern = a.techStack.some((t) => ["React", "Next.js", "Shopify", "Webflow"].includes(t)) ? 70 : 45;
  const uiScore = Math.round((a.mobileScore + modern) / 2);
  const factors: ScoreFactor[] = [
    { key: "website", label: "Website Quality Gap", weight: 30, value: 100 - a.overallScore },
    { key: "seo", label: "SEO Problems", weight: 25, value: 100 - a.seoScore },
    { key: "security", label: "Security Gaps", weight: 20, value: 100 - a.securityScore },
    { key: "mobile", label: "Mobile Readiness", weight: 15, value: 100 - a.mobileScore },
    { key: "perf", label: "Performance", weight: 10, value: 100 - a.perfScore },
  ];
  const leadScore = Math.round(factors.reduce((s, f) => s + f.value * f.weight, 0) / factors.reduce((s, f) => s + f.weight, 0));

  return {
    id,
    company: companyFromDomain(a.domain),
    domain: a.domain,
    website: a.finalUrl,
    ownerName: "",
    industry: "Unknown",
    category: "Unknown",
    opportunityType: opportunitiesFrom(a),
    country: "Unknown",
    countryCode: "US",
    state: "",
    city: "",
    employees: 0,
    revenueMinor: 0,
    currency: "USD",
    techStack: a.techStack,
    cms: a.cms,
    hosting: a.hosting,
    domainAgeDays: a.domainAgeDays,
    trafficBand: "Unknown",
    leadScore,
    websiteScore: a.overallScore,
    uiScore,
    seoScore: a.seoScore,
    scoreFactors: factors,
    websiteStatus: websiteStatusFrom(a),
    appStatus: "NONE",
    stage: "NEW",
    status: "ACTIVE",
    tags: ["scanned"],
    source: "Website Scanner",
    screenshotUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(a.domain)}`,
    logoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(companyFromDomain(a.domain))}&backgroundType=gradientLinear`,
    contacts: [],
    websiteAudit: {
      sslValid: a.sslValid,
      perfScore: a.perfScore,
      lcpMs: a.ttfbMs,
      clsScore: 0,
      seoScore: a.seoScore,
      securityScore: a.securityScore,
      accessibilityScore: a.accessibilityScore,
      overallScore: a.overallScore,
      mobileFriendly: a.hasViewport,
      hasAnalytics: a.hasAnalytics,
      hasSchema: a.hasSchema,
      findings: a.findings,
    },
    uiAudit: {
      uiScore,
      uxScore: a.overallScore,
      trustScore: a.securityScore,
      brandingScore: 50,
      conversionScore: a.hasContactForm ? 60 : 35,
      modernScore: modern,
      summary:
        `Technical audit of ${a.domain} (real, measured). Performance ${a.perfSource === "pagespeed" ? "via Lighthouse" : "measured from TTFB/page weight"}. ` +
        `Add an ANTHROPIC_API_KEY to enable AI vision scoring of the design.`,
    },
    activity: [
      { id: `act_${Date.now()}`, type: "scanned", label: `Scanned — website score ${a.overallScore}/100`, actor: "Website Scanner", at: now },
    ],
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export interface ScanOutcome {
  lead: Lead;
  audit: AuditResult;
  isNew: boolean;
}

export const scannerRepository = {
  async scan(orgId: string, url: string): Promise<ScanOutcome> {
    const audit = await auditWebsite(url);
    if (audit.error) throw new Error(audit.error);

    if (!hasDatabase) {
      return { lead: buildLeadFromAudit(audit, `sc_${Date.now().toString(36)}`), audit, isNew: true };
    }

    const prisma = getPrisma();
    const existing = await prisma.lead.findFirst({ where: { orgId, domain: audit.domain }, select: { id: true } });

    if (existing) {
      const rebuilt = buildLeadFromAudit(audit, existing.id);
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          leadScore: rebuilt.leadScore,
          websiteScore: rebuilt.websiteScore,
          uiScore: rebuilt.uiScore,
          seoScore: rebuilt.seoScore,
          opportunityType: rebuilt.opportunityType,
          websiteStatus: rebuilt.websiteStatus,
          techStack: rebuilt.techStack,
          cms: rebuilt.cms,
          hosting: rebuilt.hosting,
          scoreFactors: rebuilt.scoreFactors as unknown as Prisma.InputJsonValue,
          websiteAudit: rebuilt.websiteAudit as unknown as Prisma.InputJsonValue,
          uiAudit: rebuilt.uiAudit as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
      const lead = (await leadsRepository.byId(orgId, existing.id))!;
      return { lead, audit, isNew: false };
    }

    const id = `sc_${Date.now().toString(36)}`;
    const built = buildLeadFromAudit(audit, id);
    await prisma.lead.create({ data: leadCreateData(orgId, built) });
    const lead = (await leadsRepository.byId(orgId, id))!;
    return { lead, audit, isNew: true };
  },

  /** Background: run real Google Lighthouse (slow) and update the lead's performance. */
  async enrichPerformance(orgId: string, leadId: string): Promise<{ perfScore: number; overallScore: number } | null> {
    if (!hasDatabase) return null;
    const prisma = getPrisma();
    const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId }, select: { website: true, websiteAudit: true } });
    if (!lead) return null;

    const ps = await runPageSpeed(lead.website);
    if (!ps) return null;

    const audit = lead.websiteAudit as unknown as WebsiteAudit;
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const mobileScore = audit.mobileFriendly ? 92 : 28;
    const overall = clamp(ps.perf * 0.3 + (audit.seoScore ?? 0) * 0.25 + (audit.securityScore ?? 0) * 0.25 + mobileScore * 0.2);
    const updated: WebsiteAudit = { ...audit, perfScore: ps.perf, overallScore: overall };

    await prisma.lead.update({
      where: { id: leadId },
      data: { websiteScore: overall, websiteAudit: updated as unknown as Prisma.InputJsonValue, updatedAt: new Date() },
    });
    return { perfScore: ps.perf, overallScore: overall };
  },
};
