"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Database,
  Sparkles,
  Target,
  Unplug,
  PenTool,
  Smartphone,
  MailCheck,
  Phone,
  Building2,
  Globe,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { KPIS } from "@/lib/mock/metrics";
import { formatCompact, formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { Kpi } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Database, Sparkles, Target, Unplug, PenTool, Smartphone,
  MailCheck, Phone, Building2, Globe, TrendingUp, DollarSign,
};

const ACCENT: Record<Kpi["accent"], string> = {
  primary: "text-primary bg-primary/12",
  accent: "text-accent bg-accent/12",
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/12",
  info: "text-info bg-info/12",
  destructive: "text-destructive bg-destructive/12",
};

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function formatValue(kpi: Kpi, v: number): string {
  switch (kpi.format) {
    case "currency":
      return formatCurrency(v, "USD");
    case "compact":
      return formatCompact(v);
    case "percent":
      return formatPercent(v, 1);
    default:
      return formatNumber(Math.round(v));
  }
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(" ");
  const color = positive ? "hsl(var(--success))" : "hsl(var(--destructive))";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

function KpiTile({ kpi, index }: { kpi: Kpi; index: number }) {
  const animated = useCountUp(kpi.value);
  const Icon = ICONS[kpi.icon] ?? Database;
  const positive = kpi.delta >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
    >
      <GlassCard interactive className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", ACCENT[kpi.accent])}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(kpi.delta)}%
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-semibold tabular-nums tracking-tight">{formatValue(kpi, animated)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</div>
        </div>
        <div className="mt-2 flex justify-end">
          <Sparkline data={kpi.spark} positive={positive} />
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function KpiCards({ kpis = KPIS }: { kpis?: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {kpis.map((kpi, i) => (
        <KpiTile key={kpi.key} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
