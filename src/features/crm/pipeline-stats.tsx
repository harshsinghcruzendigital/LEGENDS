"use client";

import { DollarSign, TrendingUp, Trophy, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { dealValue } from "@/features/crm/deal-card";
import type { Lead, Stage } from "@/lib/types";

/** Stage → win probability (docs/04 Deal.probability defaults). */
export const STAGE_PROBABILITY: Record<Stage, number> = {
  NEW: 5,
  RESEARCH: 15,
  CONTACTED: 25,
  MEETING: 45,
  PROPOSAL: 60,
  NEGOTIATION: 80,
  WON: 100,
  LOST: 0,
};

export function PipelineStats({ leads }: { leads: Lead[] }) {
  const open = leads.filter((l) => !["WON", "LOST"].includes(l.stage));
  const openValue = open.reduce((s, l) => s + dealValue(l), 0);
  const weighted = open.reduce((s, l) => s + (dealValue(l) * STAGE_PROBABILITY[l.stage]) / 100, 0);
  const won = leads.filter((l) => l.stage === "WON");
  const wonValue = won.reduce((s, l) => s + dealValue(l), 0);
  const closed = leads.filter((l) => ["WON", "LOST"].includes(l.stage)).length;
  const winRate = closed ? (won.length / closed) * 100 : 0;
  const avg = open.length ? openValue / open.length : 0;

  const tiles = [
    { label: "Open Pipeline", value: formatCurrency(openValue), sub: `${open.length} deals`, icon: DollarSign, accent: "text-primary bg-primary/12" },
    { label: "Weighted Forecast", value: formatCurrency(weighted), sub: "probability-adjusted", icon: TrendingUp, accent: "text-accent bg-accent/12" },
    { label: "Won", value: formatCurrency(wonValue), sub: `${won.length} closed-won`, icon: Trophy, accent: "text-success bg-success/12" },
    { label: "Win Rate", value: formatPercent(winRate, 0), sub: `avg ${formatCurrency(avg)}`, icon: Target, accent: "text-warning bg-warning/12" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <GlassCard key={t.label} className="p-4">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.accent}`}>
              <t.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold tabular-nums">{t.value}</div>
              <div className="truncate text-xs text-muted-foreground">{t.label}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground/80">{t.sub}</div>
        </GlassCard>
      ))}
    </div>
  );
}
