import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { workflowsRepository } from "@/server/repositories/workflows.repo";

export const workflowsRouter = router({
  list: protectedProcedure.query(({ ctx }) => workflowsRepository.list(ctx.orgId)),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const w = await workflowsRepository.byId(ctx.orgId, input.id);
    if (!w) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
    return w;
  }),
});
