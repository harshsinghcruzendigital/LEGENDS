"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader2, Globe, ShieldCheck, Zap, Smartphone, TrendingUp, Eye, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScoreRing, ScoreBar } from "@/components/ui/score-ring";
import { SeverityBadge } from "@/components/ui/domain-badges";
import { LeadDetail } from "@/features/leads/lead-detail";
import { trpc } from "@/lib/trpc/client";
import type { Lead } from "@/lib/types";
import type { AuditResult } from "@/server/services/website-audit";

const EXAMPLES = ["stripe.com", "a-slow-old-site.example", "shopify.com"];

export function ScannerView() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [url, setUrl] = React.useState("");
  const [result, setResult] = React.useState<{ lead: Lead; audit: AuditResult; isNew: boolean } | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const scan = trpc.scanner.scan.useMutation();

  function runScan(target?: string) {
    const value = (target ?? url).trim();
    if (!value) {
      toast.error("Enter a website URL to scan.");
      return;
    }
    setResult(null);
    scan.mutate(
      { url: value },
      {
        onSuccess: (data) => {
          setResult(data);
          utils.leads.list.invalidate();
          utils.metrics.dashboard.invalidate();
          toast.success(data.isNew ? `Scanned & saved ${data.lead.domain}` : `Re-scanned ${data.lead.domain}`);
        },
        onError: (err) => toast.error(err.message || "Scan failed"),
      },
    );
  }

  const a = result?.audit;

  return (
    <div className="space-y-5">
      {/* Input */}
      <GlassCard className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              placeholder="Enter a real website URL — e.g. acme-plumbing.com"
              className="h-11 pl-9"
              disabled={scan.isPending}
            />
          </div>
          <Button size="lg" onClick={() => runScan()} disabled={scan.isPending}>
            {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {scan.isPending ? "Scanning…" : "Scan Website"}
          </Button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Try:</span>
          {EXAMPLES.slice(0, 2).map((ex) => (
            <button key={ex} onClick={() => { setUrl(ex); runScan(ex); }} className="rounded-full border border-border px-2 py-0.5 hover:bg-secondary/60" disabled={scan.isPending}>
              {ex}
            </button>
          ))}
          <span className="ml-auto">Real audit · SSL, security, SEO, mobile & performance</span>
        </div>
      </GlassCard>

      {/* Running */}
      {scan.isPending && (
        <GlassCard className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching the page and measuring real signals…</p>
        </GlassCard>
      )}

      {/* Result */}
      {result && a && !scan.isPending && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div className="flex items-center gap-4">
                <ScoreRing score={a.overallScore} size={64} label="Overall" />
                <div>
                  <CardTitle className="text-lg">{result.lead.company}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <a href={a.finalUrl} target="_blank" rel="noreferrer" className="hover:text-primary">{a.domain}</a>
                    <ExternalLink className="h-3 w-3" />
                    <Badge variant={result.isNew ? "success" : "muted"} className="ml-1">{result.isNew ? "New lead saved" : "Updated"}</Badge>
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setResult(null); setUrl(""); }}><Plus className="h-4 w-4" /> Scan another</Button>
                <Button size="sm" onClick={() => setDetailOpen(true)}><Eye className="h-4 w-4" /> View lead</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* sub scores */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SubScore icon={Zap} label={`Performance${a.perfSource === "pagespeed" ? " (Lighthouse)" : ""}`} score={a.perfScore} />
                <SubScore icon={ShieldCheck} label="Security" score={a.securityScore} />
                <SubScore icon={TrendingUp} label="SEO" score={a.seoScore} />
                <SubScore icon={Smartphone} label="Mobile" score={a.mobileScore} />
              </div>

              {/* measured facts */}
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <Fact label="SSL" value={a.sslValid ? "Valid" : "Missing"} good={a.sslValid} />
                <Fact label="TTFB" value={`${a.ttfbMs}ms`} good={a.ttfbMs < 1000} />
                <Fact label="Page weight" value={`${a.pageWeightKb}KB`} good={a.pageWeightKb < 1500} />
                <Fact label="Mobile viewport" value={a.hasViewport ? "Yes" : "No"} good={a.hasViewport} />
              </div>

              {a.techStack.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Detected:</span>
                  {a.cms !== "Unknown" && <Badge variant="secondary" className="font-mono text-[10px]">{a.cms}</Badge>}
                  {a.techStack.map((t) => <Badge key={t} variant="secondary" className="font-mono text-[10px]">{t}</Badge>)}
                </div>
              )}

              {/* findings */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Findings · {a.findings.length}
                </h3>
                {a.findings.length === 0 ? (
                  <p className="text-sm text-success">No major issues found — this site is in good shape.</p>
                ) : (
                  <ul className="space-y-2">
                    {a.findings.map((f) => (
                      <li key={f.code} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{f.title}</span>
                          <SeverityBadge severity={f.severity} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Opportunity score: <span className="font-semibold text-foreground">{result.lead.leadScore}/100</span></span>
                <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>Open Lead Database →</Button>
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
      )}

      {!result && !scan.isPending && (
        <GlassCard className="p-5">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"><Search className="h-4 w-4" /></div>
            <div>
              <p className="font-medium text-foreground">This is real data.</p>
              <p className="mt-0.5">Paste any live business website. We fetch its homepage, measure SSL, security headers, SEO tags, mobile-readiness, tech stack and load time, then save it as a lead you can work. Performance uses Google Lighthouse when a PageSpeed key is configured, otherwise measured TTFB/page weight.</p>
            </div>
          </div>
        </GlassCard>
      )}

      <LeadDetail lead={result?.lead ?? null} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

function SubScore({ icon: Icon, label, score }: { icon: typeof Zap; label: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/20 py-3">
      <ScoreRing score={score} size={44} strokeWidth={4} />
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Icon className="h-3 w-3" /> {label}</span>
    </div>
  );
}

function Fact({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${good ? "text-success" : "text-warning"}`}>{value}</div>
    </div>
  );
}
