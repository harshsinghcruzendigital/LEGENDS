import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { discoveryRepository } from "@/server/repositories/discovery.repo";
import type { OpportunityType } from "@/lib/types";

const OPPORTUNITY = z.enum([
  "BROKEN_SITE", "OUTDATED", "SLOW", "NO_SSL", "NOT_RESPONSIVE", "BAD_UX",
  "SEO", "NO_ECOMMERCE", "POOR_BRANDING", "NO_SOCIAL", "APP_POOR", "APP_STALE", "DIGITAL_TRANSFORM",
]);

export const discoveryRouter = router({
  run: protectedProcedure
    .input(
      z.object({
        sources: z.array(z.string()).min(1),
        industries: z.array(z.string()).default([]),
        countries: z.array(z.string()).default([]),
        opportunities: z.array(OPPORTUNITY).default([]),
        keywords: z.string().default(""),
        minScore: z.number().int().min(0).max(100).default(0),
        limit: z.number().int().min(1).max(50).default(25),
      }),
    )
    .mutation(({ ctx, input }) =>
      discoveryRepository.run(ctx.orgId, { ...input, opportunities: input.opportunities as OpportunityType[] }),
    ),
});
