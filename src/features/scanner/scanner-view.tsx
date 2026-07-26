"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, Check, X, Eye, Plus, ShieldCheck, Zap, Smartphone, TrendingUp, ExternalLink, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { SeverityBadge } from "@/components/ui/domain-badges";
import { LeadDetail } from "@/features/leads/lead-detail";
import { trpc } from "@/lib/trpc/client";
import type { Lead } from "@/lib/types";
import type { AuditResult } from "@/server/services/website-audit";

type ScanResult = { lead: Lead; audit: AuditResult; isNew: boolean };
type Job = { url: string; status: "pending" | "running" | "done" | "error"; result?: ScanResult; error?: string; enriching?: boolean; lighthouse?: boolean };

const MAX_URLS = 25;

function parseUrls(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((u) => {
      const k = u.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, MAX_URLS);
}

export function ScannerView() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const scan = trpc.scanner.scan.useMutation();
  const enrich = trpc.scanner.enrichPerformance.useMutation();
  const [input, setInput] = React.useState("");
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [running, setRunning] = React.useState(false);
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  async function runAll(preset?: string) {
    const urls = parseUrls(preset ?? input);
    if (urls.length === 0) {
      toast.error("Enter at least one website URL.");
      return;
    }
    setJobs(urls.map((url) => ({ url, status: "pending" })));
    setRunning(true);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < urls.length; i++) {
      setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "running" } : j)));
      try {
        const result = await scan.mutateAsync({ url: urls[i] });
        setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "done", result } : j)));
        ok++;
        enrichJob(i, result.lead.id); // fire real Lighthouse in the background
      } catch (e) {
        setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "error", error: e instanceof Error ? e.message : "failed" } : j)));
        fail++;
      }
    }
    setRunning(false);
    utils.leads.list.invalidate();
    utils.metrics.dashboard.invalidate();
    toast.success(`Scanned ${ok} site${ok !== 1 ? "s" : ""}${fail ? ` · ${fail} failed` : ""}.`);
  }

  function openLead(lead: Lead) {
    setSelected(lead);
    setDetailOpen(true);
  }

  function enrichJob(i: number, leadId: string) {
    setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, enriching: true } : j)));
    enrich
      .mutateAsync({ leadId })
      .then((scores) => {
        setJobs((prev) =>
          prev.map((j, idx) => {
            if (idx !== i || !j.result) return j;
            if (!scores) return { ...j, enriching: false };
            return {
              ...j,
              enriching: false,
              lighthouse: true,
              result: {
                ...j.result,
                audit: { ...j.result.audit, perfScore: scores.perfScore, accessibilityScore: scores.accessibilityScore, overallScore: scores.overallScore },
              },
            };
          }),
        );
        utils.leads.list.invalidate();
      })
      .catch(() => setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, enriching: false } : j))));
  }

  const done = jobs.filter((j) => j.status === "done" && j.result);
  const avg = done.length ? Math.round(done.reduce((s, j) => s + (j.result!.audit.overallScore || 0), 0) / done.length) : 0;
  const issues = done.reduce((s, j) => s + (j.result!.audit.findings.length || 0), 0);
  const urlCount = parseUrls(input).length;

  return (
    <div className="space-y-5">
      {/* Input */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 pb-2 text-sm font-medium">
          <ListChecks className="h-4 w-4 text-primary" /> Scan one or many websites
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          disabled={running}
          placeholder={"Paste real website URLs — one per line, e.g.\nacme-plumbing.com\njoes-diner.com\nvintage-furniture-co.com"}
          className="w-full resize-y rounded-lg border border-input bg-background/50 px-3 py-2 text-sm scrollbar-thin focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={() => runAll()} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {running ? "Scanning…" : urlCount > 1 ? `Scan ${urlCount} websites` : "Scan Website"}
          </Button>
          {jobs.length > 0 && !running && (
            <Button size="lg" variant="outline" onClick={() => { setJobs([]); setInput(""); }}>
              <Plus className="h-4 w-4" /> New batch
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">Real audit · SSL, security, SEO, mobile, performance & domain age · up to {MAX_URLS} at once</span>
        </div>
        {jobs.length === 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Try:</span>
            {["stripe.com", "example.com"].map((ex) => (
              <button key={ex} onClick={() => { setInput(ex); runAll(ex); }} disabled={running} className="rounded-full border border-border px-2 py-0.5 hover:bg-secondary/60">
                {ex}
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Summary */}
      {done.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Scanned" value={String(done.length)} />
          <Stat label="Avg. website score" value={`${avg}/100`} />
          <Stat label="Issues found" value={String(issues)} />
        </div>
      )}

      {/* Jobs */}
      {jobs.length > 0 && (
        <GlassCard className="p-0">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>Each scanned site is saved as a lead in your database</CardDescription>
          </CardHeader>
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {jobs.map((job, i) => (
                <motion.div key={job.url + i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3">
                  <StatusIcon status={job.status} score={job.result?.audit.overallScore} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{job.result?.lead.company ?? displayDomain(job.url)}</span>
                      {job.result?.isNew && <Badge variant="success" className="text-[10px]">saved</Badge>}
                      {job.result && !job.result.isNew && <Badge variant="muted" className="text-[10px]">updated</Badge>}
                    </div>
                    {job.status === "done" && job.result ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {job.result.audit.securityScore}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> SEO {job.result.audit.seoScore}</span>
                        {job.enriching ? (
                          <span className="flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" /> Lighthouse…</span>
                        ) : job.lighthouse ? (
                          <span className="flex items-center gap-1 text-primary"><Zap className="h-3 w-3" /> Perf {job.result.audit.perfScore} · Lighthouse</span>
                        ) : (
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {job.result.audit.ttfbMs}ms</span>
                        )}
                        <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {job.result.audit.hasViewport ? "mobile" : "not mobile"}</span>
                        {job.result.audit.findings.length > 0 && <SeverityBadge severity={job.result.audit.findings[0].severity} />}
                        <span>· {job.result.audit.findings.length} issues</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {job.status === "error" ? <span className="text-destructive">{job.error}</span> : job.status === "running" ? "Auditing…" : displayDomain(job.url)}
                      </div>
                    )}
                  </div>
                  {job.status === "done" && job.result && (
                    <Button variant="ghost" size="sm" onClick={() => openLead(job.result!.lead)}><Eye className="h-4 w-4" /> View</Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {!running && done.length > 0 && (
            <div className="flex justify-end border-t border-border p-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>Open Lead Database →</Button>
            </div>
          )}
        </GlassCard>
      )}

      {/* Empty info */}
      {jobs.length === 0 && (
        <GlassCard className="p-5">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success"><Search className="h-4 w-4" /></div>
            <div>
              <p className="font-medium text-foreground">This is real, live data.</p>
              <p className="mt-0.5">Paste any list of real business websites. We fetch each homepage, measure SSL, security headers, SEO tags, mobile-readiness, tech stack, load time and real domain age (RDAP), then save each as a scored lead you can sequence or work in the CRM. Add a free PageSpeed key for full Lighthouse performance scores.</p>
              <a href="https://developers.google.com/speed/docs/insights/v5/get-started" target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Get a free PageSpeed key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </GlassCard>
      )}

      <LeadDetail lead={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

function StatusIcon({ status, score }: { status: Job["status"]; score?: number }) {
  if (status === "done") return <ScoreRing score={score ?? 0} size={36} strokeWidth={3.5} />;
  if (status === "running") return <span className="flex h-9 w-9 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></span>;
  if (status === "error") return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/15 text-destructive"><X className="h-4 w-4" /></span>;
  return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Check className="h-4 w-4 opacity-30" /></span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-3.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </GlassCard>
  );
}

function displayDomain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}
