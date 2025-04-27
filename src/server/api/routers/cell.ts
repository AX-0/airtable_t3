import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cells } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export const cellRouter = createTRPCRouter({
  update: protectedProcedure
  .input(z.object({
    rowId: z.number(),
    columnId: z.number(),
    value: z.string(),
    tableId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { rowId, columnId, value, tableId } = input;

    // Check if the row exists and belongs to the table
    const row = await ctx.db.query.rows.findFirst({
      where: (r, { and, eq }) => and(eq(r.id, rowId), eq(r.tableId, tableId)),
    });
    if (!row) {
      throw new Error("Row not found or does not belong to this table");
    }

    // Check if the column exists and belongs to the table
    const column = await ctx.db.query.columns.findFirst({
      where: (c, { and, eq }) => and(eq(c.id, columnId), eq(c.tableId, tableId)),
    });
    if (!column) {
      throw new Error("Column not found or does not belong to this table");
    }

    // Finally, update the cell
    const updated = await ctx.db
      .update(cells)
      .set({ value })
      .where(and(eq(cells.rowId, rowId), eq(cells.columnId, columnId)));

    return updated;
  }),
  });
  