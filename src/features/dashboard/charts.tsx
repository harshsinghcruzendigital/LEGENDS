"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  GROWTH_SERIES,
  SOURCE_BREAKDOWN,
  OPPORTUNITY_BREAKDOWN,
  SCORE_HISTOGRAM,
  GEO_BREAKDOWN,
  PIPELINE_BY_STAGE,
} from "@/lib/mock/metrics";
import { STAGE_META } from "@/components/ui/domain-badges";
import { formatCurrency, formatNumber } from "@/lib/format";

/* Categorical palette (docs/13 §8 — dataviz rules). */
const CAT = [
  "hsl(246 89% 67%)",
  "hsl(188 85% 53%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 55%)",
  "hsl(217 91% 60%)",
  "hsl(280 70% 62%)",
  "hsl(12 80% 60%)",
  "hsl(160 60% 45%)",
];

function ChartTooltip({ active, payload, label, valueLabel }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <div className="mb-1 font-medium text-foreground">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function GrowthChart({ data = GROWTH_SERIES }: { data?: typeof GROWTH_SERIES }) {
  return (
    <GlassCard className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Lead Growth</CardTitle>
          <CardDescription>Discovered vs. qualified · last 30 days</CardDescription>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Leads</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Qualified</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
            <defs>
              <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(246 89% 67%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(246 89% 67%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gQual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(188 85% 53%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(188 85% 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
            <Area type="monotone" dataKey="leads" stroke="hsl(246 89% 67%)" strokeWidth={2} fill="url(#gLeads)" />
            <Area type="monotone" dataKey="qualified" stroke="hsl(188 85% 53%)" strokeWidth={2} fill="url(#gQual)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </GlassCard>
  );
}

export function OpportunityChart({ data = OPPORTUNITY_BREAKDOWN }: { data?: typeof OPPORTUNITY_BREAKDOWN }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-base">Opportunity Types</CardTitle>
        <CardDescription>Distribution across your pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="none">
                {data.map((_, i) => (
                  <Cell key={i} fill={CAT[i % CAT.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-1.5">
            {data.slice(0, 6).map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CAT[i % CAT.length] }} />
                <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                <span className="font-medium tabular-nums">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </GlassCard>
  );
}

export function SourceChart({ data = SOURCE_BREAKDOWN }: { data?: typeof SOURCE_BREAKDOWN }) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-base">Discovery Sources</CardTitle>
        <CardDescription>Where your leads come from</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={92} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
              {data.map((_, i) => (
                <Cell key={i} fill={CAT[i % CAT.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </GlassCard>
  );
}

export function ScoreHistogram({ data = SCORE_HISTOGRAM }: { data?: typeof SCORE_HISTOGRAM }) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-base">Lead Score Distribution</CardTitle>
        <CardDescription>Count of leads per score band</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: -20, right: 6 }}>
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={22}>
              {data.map((d, i) => {
                const mid = i * 10 + 5;
                const color = mid >= 80 ? "hsl(142 71% 45%)" : mid >= 60 ? "hsl(88 60% 48%)" : mid >= 40 ? "hsl(38 92% 55%)" : mid >= 20 ? "hsl(24 90% 55%)" : "hsl(0 72% 58%)";
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </GlassCard>
  );
}

export function GeoPanel({ data = GEO_BREAKDOWN }: { data?: typeof GEO_BREAKDOWN }) {
  const max = Math.max(...data.map((g) => g.count));
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-base">Leads by Country</CardTitle>
        <CardDescription>Top geographies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((g) => (
          <div key={g.country} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-foreground">
                <span className="text-sm">{flag(g.cc)}</span> {g.country}
              </span>
              <span className="font-medium tabular-nums text-muted-foreground">{g.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(g.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </GlassCard>
  );
}

export function PipelinePanel({ data = PIPELINE_BY_STAGE }: { data?: typeof PIPELINE_BY_STAGE }) {
  const maxValue = Math.max(...data.map((s) => s.value), 1);
  return (
    <GlassCard className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Pipeline by Stage</CardTitle>
        <CardDescription>Deal value distributed across the funnel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.map((s) => {
            const meta = STAGE_META[s.stage];
            return (
              <div key={s.stage} className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                </div>
                <div className="mt-2 text-lg font-semibold tabular-nums">{formatCurrency(s.value, "USD")}</div>
                <div className="text-xs text-muted-foreground">{s.count} leads</div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${(s.value / maxValue) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}

/** Country-code → emoji flag. */
function flag(cc: string): string {
  return cc.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
