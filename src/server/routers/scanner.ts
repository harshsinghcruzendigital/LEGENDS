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

  // TEMP diagnostic — remove after debugging PageSpeed
  psDebug: protectedProcedure.input(z.object({ url: z.string() })).mutation(async ({ input }) => {
    const key = process.env.PAGESPEED_API_KEY;
    if (!key) return { keyPresent: false } as const;
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=${encodeURIComponent(input.url)}&key=${key}`;
    try {
      const res = await fetch(api);
      const text = await res.text();
      let hasLR = false, hasCats = false, perf: number | null = null, errMsg: string | null = null;
      try {
        const d = JSON.parse(text);
        hasLR = !!d.lighthouseResult;
        hasCats = !!d?.lighthouseResult?.categories;
        perf = d?.lighthouseResult?.categories?.performance?.score ?? null;
        errMsg = d?.error?.message ?? null;
      } catch { /* ignore */ }
      return { keyPresent: true, keyLen: key.length, status: res.status, hasLR, hasCats, perf, errMsg, bodyStart: text.slice(0, 140) };
    } catch (e) {
      return { keyPresent: true, keyLen: key.length, fetchError: e instanceof Error ? e.message : "err" };
    }
  }),
});
