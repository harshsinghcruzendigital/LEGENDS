import type { Metadata } from "next";
import { Radar, Download } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/features/dashboard/kpi-cards";
import {
  GrowthChart,
  OpportunityChart,
  SourceChart,
  ScoreHistogram,
  GeoPanel,
  PipelinePanel,
} from "@/features/dashboard/charts";
import { RecentDiscoveries } from "@/features/dashboard/recent-discoveries";
import { AiRecommendations } from "@/features/dashboard/ai-recommendations";
import { getSession } from "@/server/auth";
import { getServerCaller } from "@/server/caller";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.name.split(" ")[0] ?? "there";
  const caller = await getServerCaller();
  const m = await caller.metrics.dashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what your opportunity pipeline looks like today."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm">
              <Radar className="h-4 w-4" /> New Discovery
            </Button>
          </>
        }
      />

      <KpiCards kpis={m.kpis} />

      <div className="grid gap-4 lg:grid-cols-3">
        <GrowthChart data={m.growth} />
        <OpportunityChart data={m.opportunities} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentDiscoveries items={m.recent} />
        <AiRecommendations recommendations={m.recommendations} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SourceChart data={m.sources} />
        <ScoreHistogram data={m.scoreHistogram} />
        <GeoPanel data={m.geo} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PipelinePanel data={m.pipeline} />
      </div>
    </div>
  );
}
