import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { columns, rows, tables, views } from "~/server/db/schema";

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

    createTableAndView: protectedProcedure
    .input(z.object({ baseId: z.number(), name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const table = await ctx.db.insert(tables).values({
        name: input.name,
        baseId: input.baseId,
      }).returning({ id: tables.id });
  
      const tableId = table[0]?.id;
      if (!tableId) throw new Error("Failed to create table");
  
      // Create a default view
      const view = await ctx.db.insert(views).values({
        name: "Default View",
        tableId,
        filters: [],
        sorts: [],
        hiddenColumns: [],
        searchTerm: "",
      }).returning({ id: views.id });
  
      const viewId = view[0]?.id;
      if (!viewId) throw new Error("Failed to create view");

      // Create a col
      const col = await ctx.db.insert(columns).values({
        name: `col_1`,
        tableId,
      }).returning({ id: columns.id });

      // Create a row
      const row = await ctx.db.insert(rows).values({
        name: `Row 1`,
        tableId,
      }).returning({ id: rows.id });
  
      return { tableId, viewId };
    })
  
}) 