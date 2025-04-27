import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cells, rows } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export const rowRouter = createTRPCRouter({
    createRow: protectedProcedure
    .input(z.object({
      tableId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { tableId } = input;
  
      const insertedRow = await ctx.db.insert(rows).values({
        name: "New Row",
        tableId,
      }).returning({ id: rows.id });
  
      const rowId = insertedRow[0]?.id;
      if (!rowId) {
        throw new Error("Failed to create column");
      }

      const colsInTable = await ctx.db.query.columns.findMany({
        where: (c, { eq }) => eq(c.tableId, tableId),
      });

      if (colsInTable.length > 0) {
        const newCells = colsInTable.map((col) => ({
          rowId: rowId,
          columnId: col.id,
          value: "",
        }));
  
        await ctx.db.insert(cells).values(newCells);
      }
  
      return {success: true, rowId};
    }),
  
});
  