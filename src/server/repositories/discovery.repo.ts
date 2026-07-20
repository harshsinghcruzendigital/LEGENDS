/**
 * Discovery repository (docs/10 §7). Generates candidate leads from an ICP config
 * and PERSISTS the new ones into the caller's org (deduped by domain). With no
 * database it returns generated leads without saving (mock mode). This is what
 * makes the core loop real end-to-end: a discovery run fills the Lead Database.
 */
import { Prisma } from "@prisma/client";
import { hasDatabase, getPrisma } from "@/server/db";
import { discoverLeads } from "@/lib/mock/leads";
import type { Lead, OpportunityType } from "@/lib/types";

export interface DiscoveryRunInput {
  sources: string[];
  industries: string[];
  countries: string[];
  opportunities: OpportunityType[];
  keywords: string;
  minScore: number;
  limit: number;
}

export interface DiscoveryRunResult {
  leads: Lead[];
  count: number;
  qualified: number;
  duplicates: number;
}

/** Deterministic seed from the config (same ICP → same candidates). */
function seedFromConfig(c: DiscoveryRunInput): number {
  const str = JSON.stringify({
    s: [...c.sources].sort(),
    i: [...c.industries].sort(),
    o: [...c.opportunities].sort(),
    co: [...c.countries].sort(),
    k: c.keywords.trim().toLowerCase(),
    m: c.minScore,
  });
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function estimateCount(c: DiscoveryRunInput): number {
  const breadth =
    (c.sources.length || 1) *
    (c.industries.length ? c.industries.length : 4) *
    (c.countries.length ? c.countries.length : 3);
  return Math.min(c.limit, Math.max(6, Math.round(breadth * 1.4)));
}

function leadCreateData(orgId: string, l: Lead): Prisma.LeadUncheckedCreateInput {
  return {
    id: l.id,
    orgId,
    company: l.company,
    domain: l.domain,
    website: l.website,
    ownerName: l.ownerName,
    industry: l.industry,
    category: l.category,
    opportunityType: l.opportunityType as OpportunityType[],
    country: l.country,
    countryCode: l.countryCode,
    state: l.state,
    city: l.city,
    employees: l.employees,
    revenueMinor: BigInt(l.revenueMinor),
    currency: l.currency,
    techStack: l.techStack,
    cms: l.cms,
    hosting: l.hosting,
    domainAgeDays: l.domainAgeDays,
    trafficBand: l.trafficBand,
    leadScore: l.leadScore,
    websiteScore: l.websiteScore,
    uiScore: l.uiScore,
    seoScore: l.seoScore,
    appScore: l.appScore ?? null,
    scoreFactors: l.scoreFactors as unknown as Prisma.InputJsonValue,
    websiteStatus: l.websiteStatus,
    appStatus: l.appStatus,
    playStoreUrl: l.playStoreUrl ?? null,
    appStoreUrl: l.appStoreUrl ?? null,
    stage: l.stage,
    status: l.status,
    assignedTo: l.assignedTo ?? null,
    tags: l.tags,
    hasVerifiedEmail: l.contacts.some((c) => c.emailStatus === "VALID"),
    source: l.source,
    screenshotUrl: l.screenshotUrl,
    logoUrl: l.logoUrl,
    websiteAudit: l.websiteAudit as unknown as Prisma.InputJsonValue,
    uiAudit: l.uiAudit as unknown as Prisma.InputJsonValue,
    activity: l.activity as unknown as Prisma.InputJsonValue,
    notes: l.notes as unknown as Prisma.InputJsonValue,
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
    contacts: {
      create: l.contacts.map((c, i) => ({
        id: `${l.id}_ct${i}`,
        orgId,
        fullName: c.fullName,
        title: c.title,
        role: c.role,
        email: c.email,
        emailStatus: c.emailStatus,
        emailConfidence: c.emailConfidence,
        phone: c.phone ?? null,
        linkedin: c.linkedin ?? null,
        isPrimary: c.isPrimary,
      })),
    },
  };
}

export const discoveryRepository = {
  async run(orgId: string, config: DiscoveryRunInput): Promise<DiscoveryRunResult> {
    const seed = seedFromConfig(config);
    const count = estimateCount(config);
    let generated = discoverLeads(count, seed, {
      industries: config.industries,
      countries: config.countries,
      opportunities: config.opportunities,
      sources: config.sources,
    });
    if (config.minScore > 0) generated = generated.filter((l) => l.leadScore >= config.minScore);
    generated.sort((a, b) => b.leadScore - a.leadScore);

    // stamp unique ids so repeat runs never collide on the PK
    const stamp = Date.now().toString(36);
    generated = generated.map((l, i) => ({ ...l, id: `dq_${stamp}_${i}` }));

    if (!hasDatabase) {
      return { leads: generated, count: generated.length, qualified: generated.filter((l) => l.leadScore >= 70).length, duplicates: 0 };
    }

    const prisma = getPrisma();
    const existing = await prisma.lead.findMany({
      where: { orgId, domain: { in: generated.map((l) => l.domain) } },
      select: { domain: true },
    });
    const seen = new Set(existing.map((e) => e.domain));
    const fresh = generated.filter((l) => !seen.has(l.domain));

    // insert new leads (+contacts) scoped to the org
    await prisma.$transaction(fresh.map((l) => prisma.lead.create({ data: leadCreateData(orgId, l) })));

    return {
      leads: fresh,
      count: fresh.length,
      qualified: fresh.filter((l) => l.leadScore >= 70).length,
      duplicates: generated.length - fresh.length,
    };
  },
};
