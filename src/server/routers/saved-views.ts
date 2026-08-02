import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { savedViewsRepository } from "@/server/repositories/saved-views.repo";

export const savedViewsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return savedViewsRepository.list(ctx.userId || "mock_user");
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        filters: z.any(),
        columns: z.any(),
        sorting: z.any(),
        isDefault: z.boolean().default(false),
      }),
    )
    .mutation(({ ctx, input }) => {
      return savedViewsRepository.create(ctx.userId || "mock_user", input as any);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        filters: z.any().optional(),
        columns: z.any().optional(),
        sorting: z.any().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return savedViewsRepository.update(ctx.userId || "mock_user", id, patch as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return savedViewsRepository.delete(ctx.userId || "mock_user", input.id);
    }),
});
