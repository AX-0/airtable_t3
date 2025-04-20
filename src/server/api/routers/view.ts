import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
  
}) 