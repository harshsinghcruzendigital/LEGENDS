"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  RefreshCw,
  Play,
  Pause,
  Users,
  Send,
  MousePointerClick,
  Reply,
  ChevronDown,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { LEADS } from "@/lib/mock/leads";
import { rate } from "@/lib/mock/campaigns";
import { generateEmail, topFinding, VARIANTS, type CopyVariant } from "@/lib/ai-copy";
import type { Campaign, CampaignStatus, SequenceStepDef, Lead } from "@/lib/types";

const STATUS_VARIANT: Record<CampaignStatus, "success" | "muted" | "warning" | "info"> = {
  ACTIVE: "success",
  DRAFT: "muted",
  PAUSED: "warning",
  COMPLETED: "info",
};

const SAMPLE_LEADS = [...LEADS].sort((a, b) => b.leadScore - a.leadScore).slice(0, 8);

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const [status, setStatus] = React.useState<CampaignStatus>(campaign.status);
  const [steps, setSteps] = React.useState<SequenceStepDef[]>(campaign.steps);
  const [lead, setLead] = React.useState<Lead>(SAMPLE_LEADS[0]);
  const [variant, setVariant] = React.useState<CopyVariant>("direct");
  const [tick, setTick] = React.useState(0); // regenerate trigger

  const email = React.useMemo(() => generateEmail(lead, variant), [lead, variant, tick]);
  const finding = topFinding(lead);

  const s = campaign.stats;

  function updateStep(id: string, patch: Partial<SequenceStepDef>) {
    setSteps((prev) => prev.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  }
  function addStep() {
    setSteps((prev) => [
      ...prev,
      { id: `step_${Date.now()}`, order: prev.length, channel: "EMAIL", delayDays: 3, subject: "Re: {{company}}", body: "Hi {{firstName}},\n\nJust following up.\n\n– {{sender}}" },
    ]);
    toast.success("Step added");
  }
  function removeStep(id: string) {
    setSteps((prev) => prev.filter((st) => st.id !== id));
  }

  function toggleStatus() {
    setStatus((st) => {
      const next = st === "ACTIVE" ? "PAUSED" : "ACTIVE";
      toast.success(next === "ACTIVE" ? "Campaign activated" : "Campaign paused");
      return next;
    });
  }

  function insertCopy() {
    setSteps((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      return [{ ...first, subject: email.subject, body: email.body }, ...rest];
    });
    toast.success("AI copy inserted into Step 1");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm"><Link href="/campaigns"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{campaign.name}</h1>
              <Badge variant={STATUS_VARIANT[status]}>{status.toLowerCase()}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{campaign.audience} · from {campaign.mailbox}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {status !== "DRAFT" && status !== "COMPLETED" && (
            <Button variant="outline" size="sm" onClick={toggleStatus}>
              {status === "ACTIVE" ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Activate</>}
            </Button>
          )}
          <Button size="sm" onClick={() => toast.success("Enrolled 24 leads from the current segment")}>
            <Users className="h-4 w-4" /> Enroll leads
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={Users} label="Enrolled" value={formatNumber(s.enrolled)} />
        <Stat icon={Send} label="Sent" value={formatNumber(s.sent)} />
        <Stat icon={Mail} label="Open Rate" value={`${rate(s.opened, s.sent)}%`} />
        <Stat icon={MousePointerClick} label="Click Rate" value={`${rate(s.clicked, s.sent)}%`} />
        <Stat icon={Reply} label="Reply Rate" value={`${rate(s.replied, s.sent)}%`} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Sequence builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sequence · {steps.length} steps</h2>
            <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-4 w-4" /> Add step</Button>
          </div>

          {steps.map((step, i) => (
            <GlassCard key={step.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{i + 1}</span>
                  <Badge variant="secondary"><Mail className="h-3 w-3" /> Email</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {i === 0 ? "Immediately" : `Wait ${step.delayDays} day${step.delayDays !== 1 ? "s" : ""}`}
                  </span>
                </div>
                {steps.length > 1 && (
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeStep(step.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {i > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Delay (days)</span>
                  <Input type="number" min={0} max={30} value={step.delayDays} onChange={(e) => updateStep(step.id, { delayDays: Number(e.target.value) })} className="h-8 w-20" />
                </div>
              )}
              <Input value={step.subject} onChange={(e) => updateStep(step.id, { subject: e.target.value })} className="mb-2 font-medium" placeholder="Subject" />
              <textarea
                value={step.body}
                onChange={(e) => updateStep(step.id, { body: e.target.value })}
                rows={6}
                className="w-full resize-y rounded-md border border-input bg-background/50 px-3 py-2 text-sm scrollbar-thin focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <TokenLegend />
            </GlassCard>
          ))}
        </div>

        {/* Analytics + audience */}
        <div className="space-y-4">
          <GlassCard>
            <CardHeader className="pb-3"><CardTitle className="text-base">Funnel</CardTitle><CardDescription>This campaign's performance</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Sent", value: s.sent, color: "bg-primary" },
                { label: "Delivered", value: s.delivered, color: "bg-info" },
                { label: "Opened", value: s.opened, color: "bg-accent" },
                { label: "Clicked", value: s.clicked, color: "bg-warning" },
                { label: "Replied", value: s.replied, color: "bg-success" },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="tabular-nums font-medium">{formatNumber(row.value)} <span className="text-muted-foreground">({rate(row.value, s.sent)}%)</span></span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${rate(row.value, s.sent || 1)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </GlassCard>
        </div>
      </div>

      {/* AI Composer */}
      <GlassCard className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent"><Sparkles className="h-4 w-4 text-white" /></span>
            <div>
              <CardTitle className="text-base">AI Copy Composer</CardTitle>
              <CardDescription>Personalized from each lead&apos;s audit findings</CardDescription>
            </div>
          </div>
          {/* Lead selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Preview for: <span className="font-medium">{lead.company}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {SAMPLE_LEADS.map((l) => (
                <DropdownMenuItem key={l.id} onClick={() => setLead(l)}>
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[10px] font-semibold">{l.leadScore}</span>
                  <span className="flex-1 truncate">{l.company}</span>
                  <span className="text-xs text-muted-foreground">{l.city}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 lg:grid-cols-[220px_1fr]">
          {/* Controls */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-2">
                <ScoreRing score={lead.leadScore} size={38} strokeWidth={4} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{lead.company}</div>
                  <div className="truncate text-xs text-muted-foreground">{lead.domain}</div>
                </div>
              </div>
              {finding && (
                <div className="mt-2 rounded-md bg-primary/10 p-2 text-xs">
                  <span className="font-medium text-primary">Hook: </span>
                  <span className="text-foreground/80">{finding.title}</span>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Tone</div>
              <div className="space-y-1.5">
                {VARIANTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setVariant(v.key)}
                    className={cn(
                      "flex w-full flex-col rounded-lg border p-2 text-left transition-colors",
                      variant === v.key ? "border-primary/40 bg-primary/[0.06]" : "border-border hover:bg-secondary/40",
                    )}
                  >
                    <span className={cn("text-sm font-medium", variant === v.key && "text-primary")}>{v.label}</span>
                    <span className="text-[11px] text-muted-foreground">{v.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw className="h-4 w-4" /> Regenerate
            </Button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border bg-background/40">
            <div className="border-b border-border px-4 py-2.5">
              <div className="text-xs text-muted-foreground">Subject</div>
              <div className="text-sm font-medium">{email.subject}</div>
            </div>
            <pre className="whitespace-pre-wrap px-4 py-3 font-sans text-sm leading-relaxed text-foreground/90">{email.body}</pre>
            <Separator />
            <div className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wand2 className="h-3.5 w-3.5 text-accent" /> Grounded in real audit data — no fabricated claims</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(`${email.subject}\n\n${email.body}`); toast.success("Copied to clipboard"); }}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button size="sm" onClick={insertCopy}><Sparkles className="h-4 w-4" /> Use in Step 1</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Mail; label: string; value: string; accent?: boolean }) {
  return (
    <GlassCard className="p-3.5">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </GlassCard>
  );
}

function TokenLegend() {
  const tokens = ["firstName", "company", "domain", "finding", "score"];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <span className="text-[10px] text-muted-foreground">Tokens:</span>
      {tokens.map((t) => (
        <code key={t} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-accent">{`{{${t}}}`}</code>
      ))}
    </div>
  );
}
