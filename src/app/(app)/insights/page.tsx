import type { Metadata } from "next";
import { Sparkles, TrendingUp, MapPin, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpportunityChart, SourceChart, ScoreHistogram, GeoPanel } from "@/features/dashboard/charts";
import { OPPORTUNITY_BREAKDOWN, SOURCE_BREAKDOWN, GEO_BREAKDOWN } from "@/lib/mock/metrics";

export const metadata: Metadata = { title: "AI Insights" };

export default function InsightsPage() {
  const topOpp = OPPORTUNITY_BREAKDOWN[0];
  const topSource = SOURCE_BREAKDOWN[0];
  const topGeo = GEO_BREAKDOWN[0];

  const insights = [
    {
      icon: TrendingUp,
      tone: "primary" as const,
      title: `${topOpp.name} is your #1 opportunity type`,
      body: `${topOpp.value} leads share this problem. Build a dedicated audit-teardown sequence around it for the highest reply rate.`,
    },
    {
      icon: MapPin,
      tone: "accent" as const,
      title: `${topGeo.country} is your densest market`,
      body: `${topGeo.count} leads are concentrated here. A localized ICP + local social proof will lift conversion.`,
    },
    {
      icon: Lightbulb,
      tone: "success" as const,
      title: `${topSource.name} is your best-performing source`,
      body: `It surfaces the most opportunities. Increase its discovery cadence and clone the filters into a scheduled ICP.`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Patterns across your pipeline — where your best opportunities come from and what to do next."
        actions={<Badge variant="accent" className="h-6"><Sparkles className="h-3 w-3" /> AI-generated</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {insights.map((ins) => (
          <GlassCard key={ins.title} className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <ins.icon className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{ins.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{ins.body}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpportunityChart />
        <SourceChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreHistogram />
        <GeoPanel />
      </div>

      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Suggested ICPs</CardTitle>
          <CardDescription>New audiences the AI recommends based on your winning patterns</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            "Shopify · Home & Furniture · US · website score ≤ 40",
            "WordPress · Restaurants · no online ordering · local",
            "Health & Wellness · missing SSL · mobile-slow",
            "Fashion brands · poor branding · no marketing pixel",
          ].map((icp) => (
            <div key={icp} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3">
              <span className="text-sm">{icp}</span>
              <Badge variant="secondary">Run</Badge>
            </div>
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
