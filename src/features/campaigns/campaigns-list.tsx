"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Mail, MousePointerClick, Reply, Users, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { rate } from "@/lib/mock/campaigns";
import { trpc } from "@/lib/trpc/client";
import { relativeTime } from "@/lib/format";
import type { CampaignStatus } from "@/lib/types";

const STATUS_VARIANT: Record<CampaignStatus, "success" | "muted" | "warning" | "info"> = {
  ACTIVE: "success",
  DRAFT: "muted",
  PAUSED: "warning",
  COMPLETED: "info",
};

export function CampaignsList() {
  const [now, setNow] = React.useState(() => Date.parse("2026-07-18T12:00:00Z"));
  React.useEffect(() => setNow(Date.now()), []);
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => toast.info("Campaign builder opens on a new sequence")}>
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
        {(campaigns ?? []).map((c) => {
          const openRate = rate(c.stats.opened, c.stats.sent);
          const clickRate = rate(c.stats.clicked, c.stats.sent);
          const replyRate = rate(c.stats.replied, c.stats.sent);
          return (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <GlassCard interactive className="h-full p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{c.name}</h3>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.audience}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[c.status]}>{c.status.toLowerCase()}</Badge>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {c.stats.enrolled}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.steps.length} steps</span>
                  <span className="ml-auto">{relativeTime(c.createdAt, now)}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Metric icon={Mail} label="Open" value={`${openRate}%`} />
                  <Metric icon={MousePointerClick} label="Click" value={`${clickRate}%`} />
                  <Metric icon={Reply} label="Reply" value={`${replyRate}%`} accent />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Mail; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-2 text-center">
      <Icon className={`mx-auto mb-1 h-3.5 w-3.5 ${accent ? "text-accent" : "text-muted-foreground"}`} />
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
