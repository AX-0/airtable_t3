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
    .input(z.object({name: z.string(), tableId: z.number(), type: z.enum(["TEXT", "NUMBER"])}))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(columns).values({
        name: input.name,
        tableId: input.tableId,
        type: input.type,
      })
    }),

    getType: protectedProcedure
    .input(z.object({columnId: z.number()}))
    .query(async ({ input }) => {
      const col = await db.query.columns.findFirst({
        where: (c, { eq }) => eq(c.id, input.columnId),
        columns: { type: true },
      });

      if (!col) throw new Error("Column not found");
      return col.type;
    }),

    getAllColNameId: protectedProcedure
    .input(z.object({tableId: z.number()}))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.columns.findMany({
        where: (cols, { eq }) => eq(cols.tableId, input.tableId),
        columns: {
          id: true,
          name: true,
          type: true,
        },
      });
    }),
}) 