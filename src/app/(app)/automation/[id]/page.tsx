import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCanvas } from "@/features/automation/workflow-canvas";
import { getWorkflow } from "@/lib/mock/workflows";
import { getServerCaller } from "@/server/caller";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const w = getWorkflow(id);
  return { title: w ? w.name : "Workflow" };
}

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await getServerCaller();
  const workflow = await caller.workflows.byId({ id }).catch(() => null);
  if (!workflow) notFound();

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm"><Link href="/automation"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{workflow.name}</h1>
          <p className="text-sm text-muted-foreground">{workflow.description}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <WorkflowCanvas workflow={workflow} />
      </div>
    </div>
  );
}
