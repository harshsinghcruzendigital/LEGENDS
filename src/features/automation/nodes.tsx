"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Zap,
  ShieldCheck,
  Reply,
  GitBranch,
  Send,
  MailCheck,
  UserPlus,
  CheckSquare,
  Bell,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WFData } from "@/lib/mock/workflows";

const ICONS: Record<string, LucideIcon> = {
  Zap, ShieldCheck, Reply, GitBranch, Send, MailCheck, UserPlus, CheckSquare, Bell, Clock,
};

const KIND_STYLES = {
  trigger: { accent: "text-primary", ring: "border-primary/40", chip: "bg-primary/15 text-primary", tag: "Trigger" },
  condition: { accent: "text-info", ring: "border-info/40", chip: "bg-info/15 text-info", tag: "Condition" },
  action: { accent: "text-accent", ring: "border-accent/40", chip: "bg-accent/15 text-accent", tag: "Action" },
  wait: { accent: "text-warning", ring: "border-warning/40", chip: "bg-warning/15 text-warning", tag: "Wait" },
} as const;

const HANDLE = "!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground";

function Shell({ data, children }: { data: WFData; children?: React.ReactNode }) {
  const style = KIND_STYLES[data.kind];
  const Icon = data.icon ? ICONS[data.icon] ?? Zap : Zap;
  return (
    <div className={cn("w-[210px] rounded-xl border bg-card p-3 shadow-md transition-shadow hover:shadow-lg", style.ring)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", style.chip)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", style.accent)}>{style.tag}</span>
      </div>
      <div className="text-sm font-medium leading-tight">{data.label}</div>
      {data.detail && <div className="mt-0.5 text-xs text-muted-foreground">{data.detail}</div>}
      {children}
    </div>
  );
}

export function TriggerNode({ data }: NodeProps) {
  return (
    <Shell data={data as WFData}>
      <Handle type="source" position={Position.Bottom} className={HANDLE} />
    </Shell>
  );
}

export function ActionNode({ data }: NodeProps) {
  return (
    <Shell data={data as WFData}>
      <Handle type="target" position={Position.Top} className={HANDLE} />
      <Handle type="source" position={Position.Bottom} className={HANDLE} />
    </Shell>
  );
}

export function WaitNode({ data }: NodeProps) {
  return (
    <Shell data={data as WFData}>
      <Handle type="target" position={Position.Top} className={HANDLE} />
      <Handle type="source" position={Position.Bottom} className={HANDLE} />
    </Shell>
  );
}

export function ConditionNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Shell data={data as WFData} />
      <Handle type="target" position={Position.Top} className={HANDLE} />
      <Handle id="true" type="source" position={Position.Bottom} style={{ left: "28%" }} className="!h-2.5 !w-2.5 !border-2 !border-background !bg-success" />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: "72%" }} className="!h-2.5 !w-2.5 !border-2 !border-background !bg-destructive" />
      <span className="absolute -bottom-4 left-[18%] text-[9px] font-medium text-success">yes</span>
      <span className="absolute -bottom-4 left-[66%] text-[9px] font-medium text-destructive">no</span>
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  wait: WaitNode,
  condition: ConditionNode,
};
