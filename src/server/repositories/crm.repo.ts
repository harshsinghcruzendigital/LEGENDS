/** CRM repository — pipeline board grouped by stage (docs/08 crm.deals.board). Prisma-flagged. */
import { hasDatabase, getPrisma } from "@/server/db";
import { mapLead } from "@/server/mappers/lead";
import { LEADS } from "@/lib/mock/leads";
import type { Lead, Stage } from "@/lib/types";

const STAGES: Stage[] = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function group(leads: Lead[]): { stage: Stage; leads: Lead[] }[] {
  return STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.stage === stage).sort((a, b) => b.leadScore - a.leadScore),
  }));
}

export const crmRepository = {
  async board(orgId: string): Promise<{ stage: Stage; leads: Lead[] }[]> {
    if (!hasDatabase) return group(LEADS);
    const rows = await getPrisma().lead.findMany({ where: { orgId }, include: { contacts: true } });
    return group(rows.map(mapLead));
  },
};
