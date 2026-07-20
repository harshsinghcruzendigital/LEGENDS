import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { campaignsRepository } from "@/server/repositories/campaigns.repo";

export const campaignsRouter = router({
  list: protectedProcedure.query(({ ctx }) => campaignsRepository.list(ctx.orgId)),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const c = await campaignsRepository.byId(ctx.orgId, input.id);
    if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    return c;
  }),
});
