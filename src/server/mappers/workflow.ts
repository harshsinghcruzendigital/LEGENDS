/** Maps a persisted Prisma Workflow to the frontend `Workflow` shape (docs/12). */
import type { Workflow as PrismaWorkflow } from "@prisma/client";
import type { Edge } from "@xyflow/react";
import type { Workflow, WFNode, WFStatus } from "@/lib/mock/workflows";

export function mapWorkflow(row: PrismaWorkflow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as WFStatus,
    runs: row.runs,
    successRate: row.successRate,
    updatedAt: row.updatedAt.toISOString(),
    nodes: row.nodes as unknown as WFNode[],
    edges: row.edges as unknown as Edge[],
  };
}
