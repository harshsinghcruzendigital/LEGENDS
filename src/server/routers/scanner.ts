import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { scannerRepository } from "@/server/repositories/scanner.repo";

export const scannerRouter = router({
  scan: protectedProcedure
    .input(z.object({ url: z.string().min(3).max(2048) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await scannerRepository.scan(ctx.orgId, input.url);
      } catch (e) {
        throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "Scan failed" });
      }
    }),

  /** Background enrichment — real Google Lighthouse performance (slow). */
  enrichPerformance: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(({ ctx, input }) => scannerRepository.enrichPerformance(ctx.orgId, input.leadId)),
});
