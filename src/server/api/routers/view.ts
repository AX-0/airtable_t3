import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { views } from "~/server/db/schema";

export const viewRouter = createTRPCRouter({
    getFirstView: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.query.views.findFirst({
        where: (v, { eq }) => eq(v.tableId, input.tableId),
        orderBy: (v) => v.id, // lowest id first
      });
  
      if (!view) throw new Error("No view found");
  
      return { tableId: input.tableId, viewId: view.id };
    }),

    getAllView: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.views.findMany({
        where: (v, { eq }) => eq(v.tableId, input.tableId),
        orderBy: (v) => v.id,
      });
    }),

    createView: protectedProcedure
    .input(z.object({
      tableId: z.number(),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const [newView] = await ctx.db.insert(views).values({
        tableId: input.tableId,
        name: input.name,
        filters: [],
        sorts: [],
        hiddenColumns: [],
        searchTerm: "",
      }).returning();
      
      if (!newView) {
        throw new Error("Failed to create view");
      }
      
      return newView;
    }),
  
}) 