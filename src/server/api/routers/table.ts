import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
    getTableData: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .query(async ({ input, ctx }) => {
      const columnsResult = await db.query.columns.findMany({
        where: ((c, { eq }) => eq(c.tableId, input.tableId)),
        orderBy: (c, { asc }) => asc(c.id),
      });
  
      const rowsResult = await db.query.rows.findMany({
        where: ((c, { eq }) => eq(c.tableId, input.tableId)),
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