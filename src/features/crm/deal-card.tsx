"use client";

import * as React from "react";
import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { OPPORTUNITY_LABELS } from "@/lib/mock/pools";
import { formatCurrency, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

/** Deal value derived from firmographics (consistent with dashboard pipeline). */
export function dealValue(lead: Lead): number {
  return Math.round(lead.revenueMinor * 0.08);
}

export function DealCard({
  lead,
  onOpen,
  dragging,
  overlay,
}: {
  lead: Lead;
  onOpen?: (l: Lead) => void;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
    disabled: overlay,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        "group rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow",
        overlay ? "rotate-2 scale-[1.02] shadow-xl ring-1 ring-primary/40" : "hover:shadow-md",
        (isDragging || dragging) && !overlay && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Drag deal"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button className="flex min-w-0 flex-1 items-start gap-2.5 text-left" onClick={() => onOpen?.(lead)}>
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-secondary">
            <Image src={lead.logoUrl} alt="" fill sizes="32px" className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{lead.company}</div>
            <div className="truncate text-xs text-muted-foreground">{lead.city}, {lead.countryCode}</div>
          </div>
          <ScoreRing score={lead.leadScore} size={34} strokeWidth={3.5} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(dealValue(lead))}</span>
        {lead.opportunityType[0] && (
          <Badge variant="accent" className="text-[10px]">{OPPORTUNITY_LABELS[lead.opportunityType[0]]}</Badge>
        )}
      </div>

      {(lead.assignedTo || lead.tags.length > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {lead.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
            ))}
          </div>
          {lead.assignedTo && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary" title={lead.assignedTo}>
              {initials(lead.assignedTo)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
