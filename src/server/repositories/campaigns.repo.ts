/** Campaigns repository (docs/08 campaigns.*). Prisma-flagged with mock fallback. */
import { hasDatabase, getPrisma } from "@/server/db";
import { mapCampaign } from "@/server/mappers/campaign";
import { CAMPAIGNS, getCampaign } from "@/lib/mock/campaigns";
import type { Campaign } from "@/lib/types";

export const campaignsRepository = {
  async list(orgId: string): Promise<Campaign[]> {
    if (!hasDatabase) return CAMPAIGNS;
    const rows = await getPrisma().campaign.findMany({
      where: { orgId },
      include: { steps: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapCampaign);
  },

  async byId(orgId: string, id: string): Promise<Campaign | null> {
    if (!hasDatabase) return getCampaign(id) ?? null;
    const row = await getPrisma().campaign.findFirst({ where: { id, orgId }, include: { steps: true } });
    return row ? mapCampaign(row) : null;
  },
};
