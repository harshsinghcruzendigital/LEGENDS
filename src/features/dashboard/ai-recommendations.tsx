import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { GlassCard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AI_RECOMMENDATIONS, type AiRec } from "@/lib/mock/metrics";
import { cn } from "@/lib/utils";

const TONE: Record<AiRec["tone"], string> = {
  primary: "border-primary/25 bg-primary/[0.06]",
  success: "border-success/25 bg-success/[0.06]",
  warning: "border-warning/25 bg-warning/[0.06]",
};

const DOT: Record<AiRec["tone"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
};

export function AiRecommendations({ recommendations = AI_RECOMMENDATIONS }: { recommendations?: AiRec[] }) {
  return (
    <GlassCard>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <CardTitle className="text-base">AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {recommendations.map((rec) => (
          <Link
            key={rec.id}
            href={rec.href}
            className={cn("group block rounded-xl border p-3 transition-colors hover:brightness-110", TONE[rec.tone])}
          >
            <div className="flex items-start gap-2">
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", DOT[rec.tone])} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{rec.title}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{rec.body}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {rec.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </GlassCard>
  );
}
