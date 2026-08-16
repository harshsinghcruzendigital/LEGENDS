/**
 * Leads repository — the single data-access seam (docs/05 §2).
 * Branches on `hasDatabase`: Postgres via Prisma (org-scoped) or the pure mock.
 * Now includes durable mutations (stage/assign/tags + notes) with activity trail.
 */
import { Prisma } from "@prisma/client";
import { hasDatabase, getPrisma } from "@/server/db";
import { mapLead } from "@/server/mappers/lead";
import { LEADS } from "@/lib/mock/leads";
import { queryLeads, type LeadListInput, type LeadListResult, type LeadFilterState } from "@/lib/leads-query";
import type { Lead, Stage, LeadStatus } from "@/lib/types";

export interface LeadPatch {
  stage?: Stage;
  assignedTo?: string | null;
  tags?: string[];
  status?: LeadStatus;
  actor?: string;
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function buildWhere(orgId: string, f: LeadFilterState): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = { orgId };
  const q = f.search.trim();
  if (q) {
    where.OR = (["company", "domain", "city", "country", "industry"] as const).map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
  }
  if (f.stages.length) where.stage = { in: f.stages as Prisma.EnumStageFilter["in"] };
  if (f.websiteStatuses.length) where.websiteStatus = { in: f.websiteStatuses as Prisma.EnumWebsiteStatusFilter["in"] };
  if (f.industries.length) where.industry = { in: f.industries };
  if (f.countries && f.countries.length) where.country = { in: f.countries };
  if (f.scorePreset === "80") where.leadScore = { gte: 80 };
  else if (f.scorePreset === "60") where.leadScore = { gte: 60 };
  else if (f.scorePreset === "low") where.leadScore = { lt: 40 };
  if (f.verifiedOnly) where.hasVerifiedEmail = true;
  return where;
}

export const leadsRepository = {
  async list(orgId: string, input: LeadListInput): Promise<LeadListResult> {
    if (!hasDatabase) return queryLeads(LEADS, input);

    const prisma = getPrisma();
    const where = buildWhere(orgId, input.filter);
    const limit = Math.max(1, Math.min(100, input.limit));

    const total = await prisma.lead.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(0, input.page), pageCount - 1);

    const [rows, industryRows, countryRows] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [input.sort.field]: input.sort.dir } as Prisma.LeadOrderByWithRelationInput,
        skip: page * limit,
        take: limit,
        include: { contacts: true },
      }),
      prisma.lead.findMany({ where: { orgId }, distinct: ["industry"], select: { industry: true } }),
      prisma.lead.findMany({ where: { orgId }, distinct: ["country"], select: { country: true } }),
    ]);

    return {
      items: rows.map(mapLead),
      total,
      page,
      pageCount,
      facets: {
        industries: industryRows.map((r) => r.industry).sort(),
        countries: countryRows.map((r) => r.country).sort(),
      },
    };
  },

  async byId(orgId: string, id: string): Promise<Lead | null> {
    if (!hasDatabase) return LEADS.find((l) => l.id === id) ?? null;
    const row = await getPrisma().lead.findFirst({ where: { id, orgId }, include: { contacts: true } });
    return row ? mapLead(row) : null;
  },

  async update(orgId: string, id: string, patch: LeadPatch): Promise<Lead | null> {
    if (!hasDatabase) {
      const l = LEADS.find((x) => x.id === id);
      if (!l) return null;
      if (patch.stage !== undefined && patch.stage !== l.stage) {
        l.activity = [{ id: `act_${Date.now()}`, type: "stage", label: `Moved to ${cap(patch.stage)}`, actor: patch.actor ?? "You", at: new Date().toISOString() }, ...l.activity];
        l.stage = patch.stage;
      }
      if (patch.assignedTo !== undefined) l.assignedTo = patch.assignedTo ?? undefined;
      if (patch.tags !== undefined) l.tags = patch.tags;
      if (patch.status !== undefined) l.status = patch.status;
      l.updatedAt = new Date().toISOString();
      return l;
    }

    const prisma = getPrisma();
    const existing = await prisma.lead.findFirst({ where: { id, orgId }, select: { stage: true, activity: true } });
    if (!existing) return null;

    const data: Prisma.LeadUncheckedUpdateInput = { updatedAt: new Date() };
    if (patch.stage !== undefined) data.stage = patch.stage;
    if (patch.assignedTo !== undefined) data.assignedTo = patch.assignedTo;
    if (patch.tags !== undefined) data.tags = patch.tags;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.stage !== undefined && patch.stage !== existing.stage) {
      const prev = Array.isArray(existing.activity) ? existing.activity : [];
      data.activity = [
        { id: `act_${Date.now()}`, type: "stage", label: `Moved to ${cap(patch.stage)}`, actor: patch.actor ?? "You", at: new Date().toISOString() },
        ...prev,
      ] as unknown as Prisma.InputJsonValue;
    }

    await prisma.lead.update({ where: { id }, data });
    return leadsRepository.byId(orgId, id);
  },

  async addNote(orgId: string, id: string, note: { author: string; body: string }): Promise<Lead | null> {
    const at = new Date().toISOString();
    const noteEntry = { id: `note_${Date.now()}`, author: note.author, body: note.body, at };
    const activityEntry = { id: `act_${Date.now()}`, type: "note", label: "Note added", actor: note.author, at };

    if (!hasDatabase) {
      const l = LEADS.find((x) => x.id === id);
      if (!l) return null;
      l.notes = [noteEntry, ...l.notes];
      l.activity = [activityEntry, ...l.activity];
      return l;
    }

    const prisma = getPrisma();
    const existing = await prisma.lead.findFirst({ where: { id, orgId }, select: { notes: true, activity: true } });
    if (!existing) return null;

    const notes = [noteEntry, ...(Array.isArray(existing.notes) ? existing.notes : [])];
    const activity = [activityEntry, ...(Array.isArray(existing.activity) ? existing.activity : [])];
    await prisma.lead.update({
      where: { id },
      data: { notes: notes as unknown as Prisma.InputJsonValue, activity: activity as unknown as Prisma.InputJsonValue },
    });
    return leadsRepository.byId(orgId, id);
  },
};
