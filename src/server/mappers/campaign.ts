/** Maps a persisted Prisma Campaign (+steps) to the frontend `Campaign` shape. */
import type { Campaign as PrismaCampaign, SequenceStep as PrismaStep } from "@prisma/client";
import type { Campaign, CampaignStats, CampaignStatus, SequenceStepDef, StepChannel } from "@/lib/types";

type Row = PrismaCampaign & { steps: PrismaStep[] };

function mapStep(s: PrismaStep): SequenceStepDef {
  return {
    id: s.id,
    order: s.order,
    channel: s.channel as StepChannel,
    delayDays: s.delayDays,
    subject: s.subject,
    body: s.body,
  };
}

export function mapCampaign(row: Row): Campaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status as CampaignStatus,
    mailbox: row.mailbox,
    audience: row.audience,
    createdAt: row.createdAt.toISOString(),
    steps: [...row.steps].sort((a, b) => a.order - b.order).map(mapStep),
    stats: row.stats as unknown as CampaignStats,
  };
}
