import type { Metadata } from "next";
import { Plus, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { PipelineStats } from "@/features/crm/pipeline-stats";
import { CrmBoard } from "@/features/crm/board";
import { getServerCaller } from "@/server/caller";

export const metadata: Metadata = { title: "CRM" };

export default async function CrmPage() {
  const caller = await getServerCaller();
  const board = await caller.crm.board();
  const leads = board.flatMap((b) => b.leads);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Pipeline"
        description="Drag deals across stages. Every card is a discovered, audited opportunity."
        actions={
          <>
            <Button variant="outline" size="sm"><LayoutGrid className="h-4 w-4" /> Board</Button>
            <Button size="sm"><Plus className="h-4 w-4" /> New Deal</Button>
          </>
        }
      />
      <PipelineStats leads={leads} />
      <CrmBoard initialBoard={board} />
    </div>
  );
}
