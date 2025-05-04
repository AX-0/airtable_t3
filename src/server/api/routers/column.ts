import { z } from "zod";
import { db } from "~/server/db";

import pLimit from 'p-limit';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { bases, tables, cells, rows, columns, views } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

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
      const { name, tableId, type } = input;

      const insertedCols = await ctx.db.insert(columns).values({
        name,
        tableId,
        type,
      }).returning({ id: columns.id });
  
      const columnId = insertedCols[0]?.id;
      if (!columnId) {
        throw new Error("Failed to create column");
      }

      const rowsInTable = await ctx.db.query.rows.findMany({
        where: (r, { eq }) => eq(r.tableId, tableId),
      });

      const newCells: { rowId: number; columnId: number; value: string }[] = [];

      if (rowsInTable.length > 0) {
        rowsInTable.forEach(row =>
          newCells.push({ rowId: row.id, columnId, value: "" })
        );
  
        // await ctx.db.insert(cells).values(newCells);
      }

      const limit = pLimit(5);
      
      await Promise.all(
        //MAX_PARAMS / 4
        chunkArray(newCells, 5000).map((chunk) =>
          limit(() => ctx.db.insert(cells).values(chunk))
        )
      );

      return { success: true, columnId };
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