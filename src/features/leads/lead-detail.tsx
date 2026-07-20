"use client";

import * as React from "react";
import Image from "next/image";
import {
  Globe,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Building2,
  Users,
  DollarSign,
  Server,
  Calendar,
  ExternalLink,
  Send,
  UserPlus,
  Sparkles,
  Plus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreRing, ScoreBar } from "@/components/ui/score-ring";
import {
  SeverityBadge,
  VerifyBadge,
  WebsiteStatusBadge,
  AppStatusBadge,
  StageBadge,
  STAGE_META,
} from "@/components/ui/domain-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import { formatCurrency, formatDate, formatDateTime, formatNumber, initials, relativeTime } from "@/lib/format";
import { trpc } from "@/lib/trpc/client";
import type { Lead, Stage } from "@/lib/types";

const ALL_STAGES: Stage[] = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export function LeadDetail({
  lead: leadProp,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [now, setNow] = React.useState(() => Date.parse("2026-07-18T12:00:00Z"));
  React.useEffect(() => setNow(Date.now()), []);

  // local copy so edits reflect instantly; re-syncs when a different lead opens
  const [lead, setLead] = React.useState<Lead | null>(leadProp);
  const [noteBody, setNoteBody] = React.useState("");
  React.useEffect(() => {
    setLead(leadProp);
    setNoteBody("");
  }, [leadProp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const utils = trpc.useUtils();
  const updateM = trpc.leads.update.useMutation();
  const addNoteM = trpc.leads.addNote.useMutation();

  const refreshLists = React.useCallback(() => {
    utils.leads.list.invalidate();
    utils.crm.board.invalidate();
    utils.metrics.dashboard.invalidate();
  }, [utils]);

  function changeStage(stage: Stage) {
    if (!lead) return;
    updateM.mutate(
      { id: lead.id, stage },
      {
        onSuccess: (u) => { setLead(u); refreshLists(); toast.success(`Moved to ${STAGE_META[stage].label}`); },
        onError: () => toast.error("Couldn't update stage"),
      },
    );
  }

  function assignToMe() {
    if (!lead) return;
    updateM.mutate(
      { id: lead.id, assignedTo: "You" },
      { onSuccess: (u) => { setLead(u); refreshLists(); toast.success("Assigned to you"); }, onError: () => toast.error("Couldn't assign") },
    );
  }

  function saveNote() {
    if (!lead || !noteBody.trim()) return;
    addNoteM.mutate(
      { id: lead.id, body: noteBody.trim() },
      { onSuccess: (u) => { setLead(u); setNoteBody(""); toast.success("Note saved"); }, onError: () => toast.error("Couldn't save note") },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {lead && (
          <>
            {/* Header */}
            <div className="border-b border-border p-5">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <Image src={lead.logoUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{lead.company}</h2>
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="h-3.5 w-3.5" /> {lead.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-secondary/60">
                          <StageBadge stage={lead.stage} />
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {ALL_STAGES.map((s) => (
                          <DropdownMenuItem key={s} onClick={() => changeStage(s)}>
                            <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[s].dot}`} /> {STAGE_META[s].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <WebsiteStatusBadge status={lead.websiteStatus} />
                    {lead.appStatus !== "NONE" && <AppStatusBadge status={lead.appStatus} />}
                  </div>
                </div>
                <ScoreRing score={lead.leadScore} size={56} label="Score" />
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => toast.success(`${lead.company} added to sequence`)}>
                  <Send className="h-4 w-4" /> Add to Sequence
                </Button>
                <Button size="sm" variant="outline" onClick={assignToMe} disabled={updateM.isPending}>
                  <UserPlus className="h-4 w-4" /> Assign
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="px-5 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="audit" className="flex-1">Audit</TabsTrigger>
                  <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
                  <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="p-5">
                  {/* OVERVIEW */}
                  <TabsContent value="overview" className="mt-0 space-y-5">
                    <Screenshot lead={lead} />

                    <Section title="Opportunity">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.opportunityType.map((o) => (
                          <Badge key={o} variant="accent">{OPPORTUNITY_LABELS[o]}</Badge>
                        ))}
                      </div>
                    </Section>

                    <Section title="Firmographics">
                      <dl className="grid grid-cols-2 gap-3">
                        <Fact icon={Building2} label="Industry" value={lead.industry} />
                        <Fact icon={Users} label="Employees" value={formatNumber(lead.employees)} />
                        <Fact icon={DollarSign} label="Est. Revenue" value={formatCurrency(lead.revenueMinor)} />
                        <Fact icon={MapPin} label="Location" value={`${lead.city}, ${lead.country}`} />
                        <Fact icon={Server} label="CMS / Hosting" value={`${lead.cms} · ${lead.hosting}`} />
                        <Fact icon={Calendar} label="Domain Age" value={`${Math.round(lead.domainAgeDays / 365)}y`} />
                      </dl>
                    </Section>

                    <Section title="Tech Stack">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.techStack.map((t) => (
                          <Badge key={t} variant="secondary" className="font-mono text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </Section>

                    <Section title={`Score Breakdown · ${lead.leadScore}/100`}>
                      <div className="space-y-2.5">
                        {lead.scoreFactors.map((f) => (
                          <ScoreBar key={f.key} score={f.value} label={`${f.label} · ${f.weight}%`} />
                        ))}
                      </div>
                    </Section>
                  </TabsContent>

                  {/* AUDIT */}
                  <TabsContent value="audit" className="mt-0 space-y-5">
                    <Section title="Quality Scores">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          ["Website", lead.websiteScore],
                          ["UI", lead.uiAudit.uiScore],
                          ["UX", lead.uiAudit.uxScore],
                          ["SEO", lead.seoScore],
                          ["Trust", lead.uiAudit.trustScore],
                          ["Conversion", lead.uiAudit.conversionScore],
                        ].map(([label, score]) => (
                          <div key={label as string} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/20 py-3">
                            <ScoreRing score={score as number} size={48} strokeWidth={4} />
                            <span className="text-[11px] text-muted-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section title="AI Summary">
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.05] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <Sparkles className="h-3.5 w-3.5" /> Generated by AI Vision Analyst
                        </div>
                        <p className="text-sm text-foreground/90">{lead.uiAudit.summary}</p>
                      </div>
                    </Section>

                    <Section title={`Findings · ${lead.websiteAudit.findings.length}`}>
                      <ul className="space-y-2">
                        {lead.websiteAudit.findings.map((f) => (
                          <li key={f.code} className="rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{f.title}</span>
                              <SeverityBadge severity={f.severity} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                            <Badge variant="muted" className="mt-2 text-[10px] uppercase">{f.category}</Badge>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </TabsContent>

                  {/* CONTACTS */}
                  <TabsContent value="contacts" className="mt-0 space-y-3">
                    {lead.contacts.map((c) => (
                      <div key={c.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {initials(c.fullName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{c.fullName}</span>
                              {c.isPrimary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{c.title}</div>
                          </div>
                        </div>
                        <Separator className="my-2.5" />
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <a href={`mailto:${c.email}`} className="flex min-w-0 items-center gap-2 text-muted-foreground hover:text-primary">
                              <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.email}</span>
                            </a>
                            <VerifyBadge status={c.emailStatus} />
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" /> {c.phone}
                            </div>
                          )}
                          {c.linkedin && (
                            <a href={`https://${c.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                              <Linkedin className="h-3.5 w-3.5" /> {c.linkedin}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* TIMELINE */}
                  <TabsContent value="timeline" className="mt-0 space-y-5">
                    <Section title="Notes">
                      <div className="space-y-2">
                        {lead.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
                        {lead.notes.map((n) => (
                          <div key={n.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{n.author}</span>
                              <span className="text-muted-foreground">{formatDate(n.at)}</span>
                            </div>
                            <p className="mt-1 text-sm">{n.body}</p>
                          </div>
                        ))}
                        <div className="rounded-lg border border-border p-2">
                          <textarea
                            value={noteBody}
                            onChange={(e) => setNoteBody(e.target.value)}
                            rows={2}
                            placeholder="Add a note…"
                            className="w-full resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
                          />
                          <div className="flex justify-end">
                            <Button size="sm" onClick={saveNote} disabled={!noteBody.trim() || addNoteM.isPending}>
                              {addNoteM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save note
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Section>

                    <Section title="Activity">
                      <ol className="relative space-y-4 border-l border-border pl-4">
                        {lead.activity.map((a) => (
                          <li key={a.id} className="relative">
                            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                            <div className="text-sm">{a.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {a.actor} · {relativeTime(a.at, now)} · {formatDateTime(a.at)}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </Section>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Screenshot({ lead }: { lead: Lead }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary">
      <Image src={lead.screenshotUrl} alt={`${lead.company} website`} fill sizes="600px" className="object-cover" unoptimized />
      <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur">
        Captured {formatDate(lead.updatedAt)}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
