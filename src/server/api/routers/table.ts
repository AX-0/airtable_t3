import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { tables } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const tableRouter = createTRPCRouter({
    getTableData: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ input, ctx }) => {
      const columnsResult = await db.query.columns.findMany({
        where: ((c, { eq }) => eq(c.tableId, Number(input.tableId))),
        orderBy: (c, { asc }) => asc(c.id),
      });
  
      const rowsResult = await db.query.rows.findMany({
        where: ((c, { eq }) => eq(c.tableId, Number(input.tableId))),
        orderBy: (r, { asc }) => asc(r.id),
      });
  
      const cellsResult = await db.query.cells.findMany({
        where: (c, { inArray }) =>
          inArray(c.rowId, rowsResult.map((r) => r.id)),
      });
  
      return {
        columns: columnsResult,
        rows: rowsResult,
        cells: cellsResult,
      };
    }),
}) 