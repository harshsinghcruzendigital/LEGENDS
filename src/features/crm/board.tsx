"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { trpc } from "@/lib/trpc/client";
import { STAGE_META } from "@/components/ui/domain-badges";
import { DealCard, dealValue } from "@/features/crm/deal-card";
import { LeadDetail } from "@/features/leads/lead-detail";
import type { Lead, Stage } from "@/lib/types";

const STAGES: Stage[] = ["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function fromArray(arr: { stage: Stage; leads: Lead[] }[]): Record<Stage, Lead[]> {
  const map = Object.fromEntries(STAGES.map((s) => [s, [] as Lead[]])) as Record<Stage, Lead[]>;
  for (const col of arr) map[col.stage] = [...col.leads];
  return map;
}

export function CrmBoard({ initialBoard }: { initialBoard: { stage: Stage; leads: Lead[] }[] }) {
  const [board, setBoard] = React.useState<Record<Stage, Lead[]>>(() => fromArray(initialBoard));
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const utils = trpc.useUtils();
  const updateStage = trpc.leads.update.useMutation();

  const activeLead = React.useMemo(
    () => (activeId ? Object.values(board).flat().find((l) => l.id === activeId) ?? null : null),
    [activeId, board],
  );

  function findStage(id: string): Stage | undefined {
    return STAGES.find((s) => board[s].some((l) => l.id === id));
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const from = findStage(String(active.id));
    const to = (STAGES.includes(over.id as Stage) ? over.id : findStage(String(over.id))) as Stage | undefined;
    if (!from || !to || from === to) return;

    const snapshot = board; // for revert on failure
    setBoard((prev) => {
      const lead = prev[from].find((l) => l.id === active.id);
      if (!lead) return prev;
      const moved: Lead = { ...lead, stage: to };
      return {
        ...prev,
        [from]: prev[from].filter((l) => l.id !== active.id),
        [to]: [moved, ...prev[to]].sort((a, b) => b.leadScore - a.leadScore),
      };
    });
    const company = activeLead?.company ?? "Deal";

    // persist the move (docs/12: a stage change is durable + can trigger workflows)
    updateStage.mutate(
      { id: String(active.id), stage: to },
      {
        onSuccess: () => {
          utils.leads.list.invalidate();
          toast.success(`${company} moved to ${STAGE_META[to].label}`);
        },
        onError: () => {
          setBoard(snapshot);
          toast.error("Couldn't save the move — reverted.");
        },
      },
    );
  }

  function openLead(l: Lead) {
    setSelected(l);
    setDetailOpen(true);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-4">
          {STAGES.map((stage) => (
            <Column key={stage} stage={stage} leads={board[stage]} onOpen={openLead} activeId={activeId} />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeLead ? (
            <div className="w-[272px]">
              <DealCard lead={activeLead} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDetail lead={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

function Column({
  stage,
  leads,
  onOpen,
  activeId,
}: {
  stage: Stage;
  leads: Lead[];
  onOpen: (l: Lead) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];
  const value = leads.reduce((s, l) => s + dealValue(l), 0);

  return (
    <div className="flex w-[288px] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          <span className="text-sm font-medium">{meta.label}</span>
          <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{leads.length}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(value)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[calc(100dvh-360px)] flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary/50 bg-primary/[0.05]" : "border-border/60 bg-secondary/10",
        )}
      >
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg text-xs text-muted-foreground/60">
            Drop deals here
          </div>
        )}
        {leads.map((l) => (
          <DealCard key={l.id} lead={l} onOpen={onOpen} dragging={activeId === l.id} />
        ))}
      </div>
    </div>
  );
}
