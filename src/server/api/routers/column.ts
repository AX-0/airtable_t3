import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { bases, tables, cells, rows, columns, views } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const columnRouter = createTRPCRouter({
    updateColumnName: protectedProcedure
    .input(z.object({ columnId: z.number(), name: z.string(), tableId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(columns)
        .set({ name: input.name })
        .where(eq(columns.id, input.columnId));
    }),

    createColumn: protectedProcedure
    .input(z.object({name: z.string(), tableId: z.number()}))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(columns).values({
        name: input.name,
        tableId: input.tableId,
      })
    }),
}) 