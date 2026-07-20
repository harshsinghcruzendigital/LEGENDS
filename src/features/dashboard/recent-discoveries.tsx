"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { RECENT_DISCOVERIES } from "@/lib/mock/metrics";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import { relativeTime } from "@/lib/format";
import type { RecentDiscovery } from "@/lib/types";

export function RecentDiscoveries({ items = RECENT_DISCOVERIES }: { items?: RecentDiscovery[] }) {
  const [now, setNow] = React.useState(() => Date.parse("2026-07-18T12:00:00Z"));
  React.useEffect(() => setNow(Date.now()), []);

  return (
    <GlassCard className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent Discoveries</CardTitle>
          <CardDescription>Freshly found and audited opportunities</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/leads">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="divide-y divide-border">
          {items.map((d) => (
            <li key={d.id}>
              <Link
                href={`/leads?lead=${d.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/50"
              >
                <ScoreRing score={d.leadScore} size={40} strokeWidth={4} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.company}</span>
                    <Badge variant="muted" className="hidden sm:inline-flex">{d.domain}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-accent">{OPPORTUNITY_LABELS[d.opportunity]}</span>
                    <span>·</span>
                    <span>{d.source}</span>
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(d.at, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </GlassCard>
  );
}
