import { router, protectedProcedure } from "@/server/trpc";
import { metricsRepository } from "@/server/repositories/metrics.repo";

export const metricsRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => metricsRepository.dashboard(ctx.orgId)),
});
