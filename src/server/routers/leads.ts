/** Leads router (docs/08 §2 leads.list / leads.get). */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { leadsRepository } from "@/server/repositories/leads.repo";

const filterSchema = z.object({
  search: z.string().default(""),
  stages: z.array(z.string()).default([]),
  websiteStatuses: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  scorePreset: z.enum(["all", "80", "60", "low"]).default("all"),
  verifiedOnly: z.boolean().default(false),
});

const sortSchema = z.object({
  field: z.enum(["leadScore", "websiteScore", "company", "createdAt", "employees", "revenueMinor"]),
  dir: z.enum(["asc", "desc"]),
});

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        filter: filterSchema.default(filterSchema.parse({})),
        sort: sortSchema.default({ field: "leadScore", dir: "desc" }),
        page: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(100).default(12),
      }),
    )
    .query(({ ctx, input }) => leadsRepository.list(ctx.orgId, input)),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const lead = await leadsRepository.byId(ctx.orgId, input.id);
    if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
    return lead;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.enum(["NEW", "RESEARCH", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
        assignedTo: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["ACTIVE", "ARCHIVED", "DUPLICATE", "DO_NOT_CONTACT"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const lead = await leadsRepository.update(ctx.orgId, id, patch);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      return lead;
    }),

  addNote: protectedProcedure
    .input(z.object({ id: z.string(), body: z.string().min(1).max(2000), author: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await leadsRepository.addNote(ctx.orgId, input.id, { author: input.author ?? "You", body: input.body });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      return lead;
    }),
});
