"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Radar,
  Play,
  Loader2,
  Check,
  Sparkles,
  Zap,
  RotateCcw,
  Eye,
  Plus,
  ChevronRight,
  History,
  Trash2,
  ShieldCheck,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/ui/score-ring";
import { WebsiteStatusBadge } from "@/components/ui/domain-badges";
import { LeadDetail } from "@/features/leads/lead-detail";
import { cn } from "@/lib/utils";
import { formatNumber, relativeTime } from "@/lib/format";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import type { Lead, OpportunityType } from "@/lib/types";
import {
  SOURCE_CATALOG,
  COUNTRIES,
  INDUSTRY_OPTIONS,
  DEFAULT_CONFIG,
  RUN_STAGES,
  estimateResults,
  seedFromConfig,
  sourceLabel,
  useDiscoveryRuns,
  type DiscoveryConfig,
  type DiscoveryRunRecord,
} from "@/lib/discovery";
import { trpc } from "@/lib/trpc/client";

const OPP_OPTIONS = Object.keys(OPPORTUNITY_LABELS) as OpportunityType[];
type Phase = "config" | "running" | "results";

export function DiscoveryConsole() {
  const router = useRouter();
  const { runs, addRun, clearRuns } = useDiscoveryRuns();
  const runMutation = trpc.discovery.run.useMutation();
  const [config, setConfig] = React.useState<DiscoveryConfig>(DEFAULT_CONFIG);
  const [phase, setPhase] = React.useState<Phase>("config");
  const [stageIdx, setStageIdx] = React.useState(0);
  const [results, setResults] = React.useState<Lead[]>([]);
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const estimate = React.useMemo(() => estimateResults(config), [config]);

  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function startRun(cfg: DiscoveryConfig) {
    if (cfg.sources.length === 0) {
      toast.error("Pick at least one source to discover from.");
      return;
    }
    setResults([]);
    setPhase("running");
    setStageIdx(0);

    // advance the pipeline animation while the server actually collects + persists
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= RUN_STAGES.length - 2) {
        setStageIdx(RUN_STAGES.length - 2);
        if (timer.current) clearInterval(timer.current);
      } else {
        setStageIdx(i);
      }
    }, 600);

    runMutation.mutate(
      {
        sources: cfg.sources,
        industries: cfg.industries,
        countries: cfg.countries,
        opportunities: cfg.opportunities,
        keywords: cfg.keywords,
        minScore: cfg.minScore,
        limit: cfg.limit,
      },
      {
        onSuccess: (data) => {
          if (timer.current) clearInterval(timer.current);
          setStageIdx(RUN_STAGES.length - 1);
          setResults(data.leads);
          setPhase("results");
          addRun({
            id: `run_${Date.now()}`,
            name: buildName(cfg),
            config: cfg,
            seed: seedFromConfig(cfg),
            count: data.count,
            qualified: data.qualified,
            createdAt: new Date().toISOString(),
          });
          const dup = data.duplicates ? ` · ${data.duplicates} already in your database` : "";
          toast.success(`Discovery complete — ${data.count} new leads saved, ${data.qualified} qualified${dup}.`);
        },
        onError: (err) => {
          if (timer.current) clearInterval(timer.current);
          setPhase("config");
          toast.error(err.message || "Discovery failed.");
        },
      },
    );
  }

  function reset() {
    if (timer.current) clearInterval(timer.current);
    setPhase("config");
    setResults([]);
    setStageIdx(0);
  }

  function openLead(l: Lead) {
    setSelected(l);
    setDetailOpen(true);
  }

  function replayRun(r: DiscoveryRunRecord) {
    setConfig(r.config);
    router.push("/leads");
  }

  return (
    <>
      <Tabs defaultValue="new" className="space-y-5">
        <TabsList>
          <TabsTrigger value="new"><Radar className="h-4 w-4" /> New Run</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4" /> History{runs.length > 0 && <Badge variant="secondary" className="ml-1">{runs.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-0">
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            {/* CONFIG */}
            <div className="space-y-4">
              <GlassCard>
                <CardHeader className="pb-3"><CardTitle className="text-base">Sources</CardTitle><CardDescription>Where to discover from (API-first, compliant)</CardDescription></CardHeader>
                <CardContent>
                  <SourcePicker
                    selected={config.sources}
                    onChange={(sources) => setConfig((c) => ({ ...c, sources }))}
                  />
                </CardContent>
              </GlassCard>

              <GlassCard>
                <CardHeader className="pb-3"><CardTitle className="text-base">Ideal Customer Profile</CardTitle><CardDescription>Filter who you want to find</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <ChipMulti label="Industries" options={INDUSTRY_OPTIONS} selected={config.industries} onChange={(v) => setConfig((c) => ({ ...c, industries: v }))} />
                  <ChipMulti label="Countries" options={COUNTRIES} selected={config.countries} onChange={(v) => setConfig((c) => ({ ...c, countries: v }))} />
                  <ChipMulti label="Opportunity signals" options={OPP_OPTIONS} labelFn={(o) => OPPORTUNITY_LABELS[o as OpportunityType]} selected={config.opportunities} onChange={(v) => setConfig((c) => ({ ...c, opportunities: v as OpportunityType[] }))} />
                  <div className="space-y-1.5">
                    <Label htmlFor="kw">Keywords</Label>
                    <Input id="kw" placeholder="e.g. handmade furniture, vegan skincare" value={config.keywords} onChange={(e) => setConfig((c) => ({ ...c, keywords: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Minimum lead score</Label>
                      <span className="text-sm font-medium tabular-nums text-primary">{config.minScore === 0 ? "Any" : `${config.minScore}+`}</span>
                    </div>
                    <input
                      type="range" min={0} max={90} step={10}
                      value={config.minScore}
                      onChange={(e) => setConfig((c) => ({ ...c, minScore: Number(e.target.value) }))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Max results</Label>
                      <span className="text-sm font-medium tabular-nums">{config.limit}</span>
                    </div>
                    <input
                      type="range" min={10} max={50} step={5}
                      value={config.limit}
                      onChange={(e) => setConfig((c) => ({ ...c, limit: Number(e.target.value) }))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    />
                  </div>
                </CardContent>
              </GlassCard>
            </div>

            {/* RUN AREA */}
            <div>
              <AnimatePresence mode="wait">
                {phase === "config" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <GlassCard className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow">
                        <Radar className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Ready to discover opportunities</h3>
                      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                        The engine will search your selected sources, audit each business, enrich contacts, and score the results.
                      </p>

                      <div className="mt-6 flex items-center gap-6 rounded-xl border border-border bg-secondary/20 px-6 py-4">
                        <Estimate label="Est. leads" value={formatNumber(estimate.count)} icon={Radar} />
                        <Separator orientation="vertical" className="h-10" />
                        <Estimate label="Est. credits" value={formatNumber(estimate.credits)} icon={Zap} accent />
                        <Separator orientation="vertical" className="h-10" />
                        <Estimate label="Sources" value={String(config.sources.length)} icon={ShieldCheck} />
                      </div>

                      <div className="mt-6 flex gap-2">
                        <Button size="lg" onClick={() => startRun(config)}><Play className="h-4 w-4" /> Run Discovery</Button>
                        <Button size="lg" variant="outline" onClick={() => toast.success("Saved as ICP")}><Sparkles className="h-4 w-4" /> Save as ICP</Button>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">Discovered leads are saved to your Lead Database. Real collectors wire in per docs/10.</p>
                    </GlassCard>
                  </motion.div>
                )}

                {phase === "running" && (
                  <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RunProgress stageIdx={stageIdx} total={results.length} />
                  </motion.div>
                )}

                {phase === "results" && (
                  <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <ResultsPanel results={results} onOpen={openLead} onReset={reset} onViewAll={() => router.push("/leads")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <RunsHistory runs={runs} onReplay={replayRun} onClear={clearRuns} />
        </TabsContent>
      </Tabs>

      <LeadDetail lead={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

/* ── sub-components ─────────────────────────────────────────── */

function Estimate({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Radar; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className={cn("mb-1 h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} />
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SourcePicker({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => (selected.includes(id) ? onChange(selected.filter((x) => x !== id)) : onChange([...selected, id]));
  return (
    <div className="space-y-3">
      {SOURCE_CATALOG.map((g) => {
        const GIcon = g.icon;
        return (
          <div key={g.group}>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <GIcon className="h-3.5 w-3.5" /> {g.group}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.sources.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChipMulti({
  label,
  options,
  selected,
  onChange,
  labelFn,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  labelFn?: (o: string) => string;
}) {
  const toggle = (o: string) => (selected.includes(o) ? onChange(selected.filter((x) => x !== o)) : onChange([...selected, o]));
  return (
    <div className="space-y-1.5">
      <Label>{label}{selected.length > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground">· {selected.length}</span>}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                on ? "border-accent/40 bg-accent/15 text-accent" : "border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {labelFn ? labelFn(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RunProgress({ stageIdx, total }: { stageIdx: number; total: number }) {
  const pct = Math.round(((stageIdx + 1) / RUN_STAGES.length) * 100);
  const processed = Math.round((total * (stageIdx + 1)) / RUN_STAGES.length);
  return (
    <GlassCard className="min-h-[420px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <div>
            <div className="font-semibold">Discovery running…</div>
            <div className="text-xs text-muted-foreground">Processing {formatNumber(processed)} of ~{formatNumber(total)} businesses</div>
          </div>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-primary">{pct}%</span>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${pct}%` }} transition={{ ease: "easeOut" }} />
      </div>

      <ol className="space-y-3">
        {RUN_STAGES.map((s, i) => {
          const done = i < stageIdx;
          const active = i === stageIdx;
          return (
            <li key={s.key} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-colors", active ? "border-primary/30 bg-primary/[0.06]" : done ? "border-border" : "border-transparent opacity-50")}>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}

function ResultsPanel({ results, onOpen, onReset, onViewAll }: { results: Lead[]; onOpen: (l: Lead) => void; onReset: () => void; onViewAll: () => void }) {
  const qualified = results.filter((l) => l.leadScore >= 70).length;
  return (
    <GlassCard className="min-h-[420px] p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"><Check className="h-4 w-4" /></span>
          <div>
            <div className="text-sm font-semibold">{results.length} leads discovered</div>
            <div className="text-xs text-muted-foreground">{qualified} qualified (score ≥ 70)</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onViewAll}><Database className="h-4 w-4" /> View in Lead Database</Button>
          <Button size="sm" variant="outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> New run</Button>
        </div>
      </div>
      <div className="max-h-[560px] divide-y divide-border overflow-y-auto scrollbar-thin">
        {results.map((l, i) => (
          <motion.button
            key={l.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            onClick={() => onOpen(l)}
            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/40"
          >
            <ScoreRing score={l.leadScore} size={40} strokeWidth={4} />
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <Image src={l.logoUrl} alt="" fill sizes="36px" className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{l.company}</span>
                <WebsiteStatusBadge status={l.websiteStatus} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{l.domain}</span><span>·</span><span>{l.city}, {l.country}</span><span>·</span><span className="text-accent">{sourceLabel(l.source) || l.source}</span>
              </div>
            </div>
            <div className="hidden gap-1 sm:flex">
              {l.opportunityType.slice(0, 2).map((o) => (
                <Badge key={o} variant="accent" className="text-[10px]">{OPPORTUNITY_LABELS[o]}</Badge>
              ))}
            </div>
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}

function RunsHistory({ runs, onReplay, onClear }: { runs: DiscoveryRunRecord[]; onReplay: (r: DiscoveryRunRecord) => void; onClear: () => void }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => setNow(Date.now()), []);

  if (runs.length === 0) {
    return (
      <GlassCard className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
        <History className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No discovery runs yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Run your first discovery to see it here.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-0">
      <div className="flex items-center justify-between border-b border-border p-4">
        <CardTitle className="text-base">Run History</CardTitle>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onClear}><Trash2 className="h-4 w-4" /> Clear</Button>
      </div>
      <div className="divide-y divide-border">
        {runs.map((r) => (
          <button key={r.id} onClick={() => onReplay(r)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary"><Radar className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-foreground">{r.count} leads</span><span>·</span>
                <span className="text-success">{r.qualified} qualified</span><span>·</span>
                <span>{r.config.sources.length} sources</span><span>·</span>
                <span>{relativeTime(r.createdAt, now)}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function buildName(cfg: DiscoveryConfig): string {
  const parts: string[] = [];
  if (cfg.industries.length) parts.push(cfg.industries.slice(0, 2).join(" / "));
  if (cfg.countries.length) parts.push(cfg.countries.slice(0, 2).join(", "));
  if (cfg.opportunities.length) parts.push(OPPORTUNITY_LABELS[cfg.opportunities[0]]);
  if (parts.length === 0) parts.push(`${cfg.sources.length} sources`);
  return parts.join(" · ");
}
