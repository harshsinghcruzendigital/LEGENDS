import {
  ShieldAlert,
  ShieldQuestion,
  ShieldCheck,
  ShieldX,
  CircleDot,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Severity, VerifyStatus, WebsiteStatus, AppStatus, Stage } from "@/lib/types";

/** Severity pill — never color-only; always carries an icon (docs/13 §8 a11y). */
const SEVERITY_MAP: Record<Severity, { variant: "destructive" | "warning" | "info" | "muted"; icon: typeof Info; label: string }> = {
  CRITICAL: { variant: "destructive", icon: ShieldX, label: "Critical" },
  HIGH: { variant: "warning", icon: AlertTriangle, label: "High" },
  MEDIUM: { variant: "warning", icon: CircleDot, label: "Medium" },
  LOW: { variant: "info", icon: Info, label: "Low" },
  INFO: { variant: "muted", icon: Info, label: "Info" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const m = SEVERITY_MAP[severity];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className={className}>
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}

const VERIFY_MAP: Record<VerifyStatus, { variant: "success" | "warning" | "destructive" | "muted"; icon: typeof ShieldCheck; label: string }> = {
  VALID: { variant: "success", icon: ShieldCheck, label: "Verified" },
  RISKY: { variant: "warning", icon: ShieldAlert, label: "Risky" },
  INVALID: { variant: "destructive", icon: ShieldX, label: "Invalid" },
  UNKNOWN: { variant: "muted", icon: ShieldQuestion, label: "Unknown" },
};

export function VerifyBadge({ status, className }: { status: VerifyStatus; className?: string }) {
  const m = VERIFY_MAP[status];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className={className}>
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}

const WEBSITE_MAP: Record<
  WebsiteStatus,
  { variant: "success" | "warning" | "destructive" | "muted" | "info" | "secondary" | "accent"; icon: typeof CheckCircle2; label: string; className?: string }
> = {
  ONLINE: { variant: "success", icon: CheckCircle2, label: "Online" },
  OFFLINE: { variant: "destructive", icon: XCircle, label: "Offline" },
  DNS_ERROR: { variant: "warning", icon: AlertTriangle, label: "DNS Error", className: "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  SSL_ERROR: { variant: "warning", icon: ShieldAlert, label: "SSL Error", className: "border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  REDIRECT_ERROR: { variant: "destructive", icon: AlertTriangle, label: "Redirect Error" },
  TIMEOUT: { variant: "muted", icon: Clock, label: "Timeout" },
};

export function WebsiteStatusBadge({ status, className }: { status: WebsiteStatus; className?: string }) {
  const m = WEBSITE_MAP[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className={cn(m.className, className)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}

const APP_MAP: Record<AppStatus, { variant: "success" | "warning" | "destructive" | "muted"; label: string } | null> = {
  NONE: { variant: "muted", label: "No App" },
  HEALTHY: { variant: "success", label: "Healthy" },
  STALE: { variant: "warning", label: "Stale" },
  POOR: { variant: "destructive", label: "Poor" },
};

export function AppStatusBadge({ status, className }: { status: AppStatus; className?: string }) {
  const m = APP_MAP[status]!;
  return (
    <Badge variant={m.variant} className={className}>
      <Smartphone className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}

export const STAGE_META: Record<Stage, { label: string; color: string; dot: string }> = {
  NEW: { label: "New", color: "text-muted-foreground", dot: "bg-slate-400" },
  RESEARCH: { label: "Research", color: "text-info", dot: "bg-info" },
  CONTACTED: { label: "Contacted", color: "text-accent", dot: "bg-accent" },
  MEETING: { label: "Meeting", color: "text-primary", dot: "bg-primary" },
  PROPOSAL: { label: "Proposal", color: "text-warning", dot: "bg-warning" },
  NEGOTIATION: { label: "Negotiation", color: "text-warning", dot: "bg-orange-400" },
  WON: { label: "Won", color: "text-success", dot: "bg-success" },
  LOST: { label: "Lost", color: "text-destructive", dot: "bg-destructive" },
};

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const m = STAGE_META[stage];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", m.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
