import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { CampaignsList } from "@/features/campaigns/campaigns-list";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="AI-personalized sequences that reference each prospect's own audit findings."
        actions={<Badge variant="accent" className="h-6"><Sparkles className="h-3 w-3" /> AI copywriting</Badge>}
      />
      <CampaignsList />
    </div>
  );
}
