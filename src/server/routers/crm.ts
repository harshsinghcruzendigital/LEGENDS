import { router, protectedProcedure } from "@/server/trpc";
import { crmRepository } from "@/server/repositories/crm.repo";

export const crmRouter = router({
  board: protectedProcedure.query(({ ctx }) => crmRepository.board(ctx.orgId)),
});
