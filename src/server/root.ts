/** Root tRPC router — the AppRouter type flows end-to-end to the client (docs/08 §2). */
import { router } from "@/server/trpc";
import { leadsRouter } from "@/server/routers/leads";
import { metricsRouter } from "@/server/routers/metrics";
import { campaignsRouter } from "@/server/routers/campaigns";
import { crmRouter } from "@/server/routers/crm";
import { workflowsRouter } from "@/server/routers/workflows";
import { discoveryRouter } from "@/server/routers/discovery";
import { scannerRouter } from "@/server/routers/scanner";
import { savedViewsRouter } from "@/server/routers/saved-views";

export const appRouter = router({
  leads: leadsRouter,
  metrics: metricsRouter,
  campaigns: campaignsRouter,
  crm: crmRouter,
  workflows: workflowsRouter,
  discovery: discoveryRouter,
  scanner: scannerRouter,
  savedViews: savedViewsRouter,
});

export type AppRouter = typeof appRouter;
