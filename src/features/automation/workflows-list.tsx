"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Workflow as WorkflowIcon, Activity, CheckCircle2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { relativeTime } from "@/lib/format";
import type { WFStatus } from "@/lib/mock/workflows";

const STATUS_VARIANT: Record<WFStatus, "success" | "warning" | "muted"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  DRAFT: "muted",
};

export function WorkflowsList() {
  const [now, setNow] = React.useState(() => Date.parse("2026-07-18T12:00:00Z"));
  React.useEffect(() => setNow(Date.now()), []);
  const { data: workflows, isLoading } = trpc.workflows.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => toast.info("Blank canvas opens for a new workflow")}>
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        {(workflows ?? []).map((w) => (
          <Link key={w.id} href={`/automation/${w.id}`}>
            <GlassCard interactive className="h-full p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <WorkflowIcon className="h-5 w-5" />
                </span>
                <Badge variant={STATUS_VARIANT[w.status]}>{w.status.toLowerCase()}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <h3 className="font-semibold">{w.name}</h3>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{w.description}</p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> {w.runs} runs</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {w.successRate}% success</span>
                <span className="ml-auto">{relativeTime(w.updatedAt, now)}</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
