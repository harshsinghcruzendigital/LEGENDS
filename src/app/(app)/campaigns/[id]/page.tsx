import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignDetail } from "@/features/campaigns/campaign-detail";
import { getServerCaller } from "@/server/caller";
import { getCampaign } from "@/lib/mock/campaigns";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCampaign(id);
  return { title: c ? c.name : "Campaign" };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await getServerCaller();
  const campaign = await caller.campaigns.byId({ id }).catch(() => null);
  if (!campaign) notFound();
  return <CampaignDetail campaign={campaign} />;
}
