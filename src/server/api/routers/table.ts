import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { columns, rows, tables, views, cells } from "~/server/db/schema";

export const tableRouter = createTRPCRouter({
  getTableData: protectedProcedure
  .input(z.object({ tableId: z.number(), cursor: z.number().optional(), limit: z.number().default(100) }))
  .query(async ({ input, ctx }) => {
    const columnsResult = await db.query.columns.findMany({
      where: ((c, { eq }) => eq(c.tableId, input.tableId)),
      orderBy: (c, { asc }) => asc(c.id),
    });

    const rowsResult = await db.query.rows.findMany({
      where: (r, { eq, gt }) =>
        input.cursor ? eq(r.tableId, input.tableId) && gt(r.id, input.cursor) : eq(r.tableId, input.tableId),
      orderBy: (r, { asc }) => asc(r.id),
      limit: input.limit,
    });

    const cellsResult = await db.query.cells.findMany({
      where: (c, { inArray }) => inArray(c.rowId, rowsResult.map((r) => r.id)),
    });

    return {
      columns: columnsResult,
      rows: rowsResult,
      cells: cellsResult,
      nextCursor: rowsResult.length === input.limit ? rowsResult.at(-1)?.id : undefined,
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
  }),

  add1k: protectedProcedure
  .input(z.object({ tableId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    const { tableId } = input;

    const existingCols = await ctx.db.query.columns.findMany({
      where: (c, { eq }) => eq(c.tableId, tableId),
    });

    if (existingCols.length === 0) throw new Error("No columns found for the table");

    // Create rows
    const rowValues = Array.from({ length: 1000 }, (_, i) => ({
      name: `Row ${i + 1}`,
      tableId,
    }));
    
    const insertedRows = await ctx.db.insert(rows).values(rowValues).returning({ id: rows.id });
    const rowIds = insertedRows.map((r) => r.id);    

    // Create and populate cells
    const faker = await import("@faker-js/faker").then((m) => m.faker);
    const cellData = [];
    
    for (const rowId of rowIds) {
      for (const col of existingCols) {
        const value =
          col.type === "NUMBER"
            ? faker.number.int({ min: 1, max: 100000 }).toString()
            : faker.person.fullName();
    
        cellData.push({ rowId, columnId: col.id, value });
      }
    }

    await ctx.db.insert(cells).values(cellData);    
  }),

  
}) 