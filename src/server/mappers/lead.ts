/**
 * Maps a persisted Prisma Lead (+contacts) back to the frontend `Lead` shape.
 * The JSON columns were seeded from the same shapes, so this is a faithful
 * round-trip. When audit/score/activity become real tables, only this mapper changes.
 */
import type { Lead as PrismaLead, Contact as PrismaContact } from "@prisma/client";
import type {
  Lead,
  Contact,
  OpportunityType,
  WebsiteStatus,
  AppStatus,
  Stage,
  LeadStatus,
  DecisionRole,
  VerifyStatus,
  WebsiteAudit,
  UiAudit,
  ScoreFactor,
  ActivityItem,
  Note,
} from "@/lib/types";

type Row = PrismaLead & { contacts: PrismaContact[] };

function mapContact(c: PrismaContact): Contact {
  return {
    id: c.id,
    fullName: c.fullName,
    title: c.title,
    role: c.role as DecisionRole,
    email: c.email,
    emailStatus: c.emailStatus as VerifyStatus,
    emailConfidence: c.emailConfidence,
    phone: c.phone ?? undefined,
    linkedin: c.linkedin ?? undefined,
    isPrimary: c.isPrimary,
  };
}

export function mapLead(row: Row): Lead {
  return {
    id: row.id,
    company: row.company,
    domain: row.domain,
    website: row.website,
    ownerName: row.ownerName,
    industry: row.industry,
    category: row.category,
    opportunityType: row.opportunityType as OpportunityType[],
    country: row.country,
    countryCode: row.countryCode,
    state: row.state,
    city: row.city,
    employees: row.employees,
    revenueMinor: Number(row.revenueMinor),
    currency: row.currency,
    techStack: row.techStack,
    cms: row.cms,
    hosting: row.hosting,
    domainAgeDays: row.domainAgeDays,
    trafficBand: row.trafficBand,
    leadScore: row.leadScore,
    websiteScore: row.websiteScore,
    uiScore: row.uiScore,
    seoScore: row.seoScore,
    appScore: row.appScore ?? undefined,
    scoreFactors: row.scoreFactors as unknown as ScoreFactor[],
    websiteStatus: row.websiteStatus as WebsiteStatus,
    appStatus: row.appStatus as AppStatus,
    playStoreUrl: row.playStoreUrl ?? undefined,
    appStoreUrl: row.appStoreUrl ?? undefined,
    stage: row.stage as Stage,
    status: row.status as LeadStatus,
    assignedTo: row.assignedTo ?? undefined,
    tags: row.tags,
    source: row.source,
    screenshotUrl: row.screenshotUrl,
    logoUrl: row.logoUrl,
    contacts: (row.contacts ?? []).map(mapContact),
    websiteAudit: row.websiteAudit as unknown as WebsiteAudit,
    uiAudit: row.uiAudit as unknown as UiAudit,
    activity: row.activity as unknown as ActivityItem[],
    notes: row.notes as unknown as Note[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
