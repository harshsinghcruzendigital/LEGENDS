/** Workflows repository (docs/08 workflows.*, docs/12). Prisma-flagged with mock fallback. */
import { hasDatabase, getPrisma } from "@/server/db";
import { mapWorkflow } from "@/server/mappers/workflow";
import { WORKFLOWS, getWorkflow, type Workflow } from "@/lib/mock/workflows";

export const workflowsRepository = {
  async list(orgId: string): Promise<Workflow[]> {
    if (!hasDatabase) return WORKFLOWS;
    const rows = await getPrisma().workflow.findMany({ where: { orgId }, orderBy: { updatedAt: "desc" } });
    return rows.map(mapWorkflow);
  },

  async byId(orgId: string, id: string): Promise<Workflow | null> {
    if (!hasDatabase) return getWorkflow(id) ?? null;
    const row = await getPrisma().workflow.findFirst({ where: { id, orgId } });
    return row ? mapWorkflow(row) : null;
  },
};
