import { z } from "zod";
import { db } from "~/server/db";

import pLimit from 'p-limit';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { columns, rows, tables, views, cells } from "~/server/db/schema";
import { and, eq, gt, ilike, inArray, isNotNull, isNull, lt, ne, not, or, sql } from "drizzle-orm";

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

const MAX_PARAMS = 65534; // tRPC max num of params

export const tableRouter = createTRPCRouter({
  getTableData: protectedProcedure
  .input(z.object({
    tableId: z.number(),
    cursor: z.number().optional(),
    limit: z.number().default(100),
    viewId: z.number(),    
  }))
  .query(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
    
    if (!view) {
      throw new Error("View not found");
    }
    
    const filters = (view.filters ?? []) as {
      columnId: number;
      operator: string;
      value: string;
    }[];
    const sorts = (view.sorts ?? []) as { // TODO
      columnId: number;
      direction: "asc" | "desc";
    }[];

    const columnsResult = await db.query.columns.findMany({
      where: ((c, { eq }) => eq(c.tableId, input.tableId)),
      orderBy: (c, { asc }) => asc(c.id),
    });

    let filteredRowIds: number[] | null = null;

    console.log("hello3");
    if (filters.length > 0) {
      const matchingRowIdSets: Set<number>[] = [];
    
      for (const filter of filters) {
        const col = cells.columnId;
        const val = cells.value;
        let condition;
    
        switch (filter.operator) {
          case "EQUALS":
            condition = and(eq(col, filter.columnId), eq(val, filter.value));
            break;
          case "CONTAINS":
            condition = and(eq(col, filter.columnId), ilike(val, `%${filter.value}%`));
            break;
          // case "NOT_CONTAINS":
          //   condition = and(eq(col, filter.columnId), not(ilike(val, `%${filter.value}%`)));
            break;
          case "GREATER_THAN":
            condition = and(eq(col, filter.columnId), gt(sql`(${val})::numeric`, Number(filter.value)));
            break;
          case "LESS_THAN":
            condition = and(eq(col, filter.columnId), lt(sql`(${val})::numeric`, Number(filter.value)));
            break;
          case "IS_EMPTY":
            condition = and(eq(col, filter.columnId), or(isNull(val), eq(val, '')));
            break;
          case "IS_NOT_EMPTY":
            condition = and(eq(col, filter.columnId), and(isNotNull(val), ne(val, '')));
            break;
          default:
            continue;
        }
    
        const matched = await ctx.db
          .selectDistinct({ rowId: cells.rowId })
          .from(cells)
          .where(condition);
    
        matchingRowIdSets.push(new Set(matched.map((c) => c.rowId)));
      }
    
      if (matchingRowIdSets.length > 0) {
        let intersection = new Set(matchingRowIdSets[0]);
        for (const s of matchingRowIdSets.slice(1)) {
          intersection = new Set([...intersection].filter((x) => s.has(x)));
        }
        filteredRowIds = [...intersection];
      }
    }
    
    console.log("hello2");
    let rowWhereClause;

    if (input.cursor) {
      rowWhereClause = and(
        eq(rows.tableId, input.tableId),
        gt(rows.id, input.cursor),
        filteredRowIds
          ? or(
              ...chunkArray(filteredRowIds, 1000).map((chunk) =>
                inArray(rows.id, chunk)
              )
            )
          : undefined
      );
    } else {
      rowWhereClause = and(
        eq(rows.tableId, input.tableId),
        filteredRowIds
          ? or(
              ...chunkArray(filteredRowIds, 1000).map((chunk) =>
                inArray(rows.id, chunk)
              )
            )
          : undefined
      );
    }
  
    let rowsResult = [];

    if (filteredRowIds && filteredRowIds.length > 0) {
      const rowChunks = chunkArray(filteredRowIds, 1000);
    
      const partials = await Promise.all(
        rowChunks.map(chunk =>
          ctx.db.query.rows.findMany({
            where: and(
              eq(rows.tableId, input.tableId),
              inArray(rows.id, chunk),
              input.cursor ? gt(rows.id, input.cursor) : undefined
            ),
            orderBy: (r, { asc }) => asc(r.id),
            limit: input.limit,
          })
        )
      );
      rowsResult = partials.flat();
    } else {
      // If no filtering
      rowsResult = await ctx.db.query.rows.findMany({
        where: input.cursor
          ? and(eq(rows.tableId, input.tableId), gt(rows.id, input.cursor))
          : eq(rows.tableId, input.tableId),
        orderBy: (r, { asc }) => asc(r.id),
        limit: input.limit,
      });
    }    

    console.log("hello1");
    const allRowIds = rowsResult.map(r => r.id);

    let cellsResult: { id: number; value: string; rowId: number; columnId: number; }[] = [];
    
    if (allRowIds.length > 0) {
      const rowIdChunks = chunkArray(allRowIds, 1000); // Same chunk size
    
      // for (const chunk of rowIdChunks) {
      //   const partialCells = await ctx.db.query.cells.findMany({
      //     where: (c, { inArray }) => inArray(c.rowId, chunk),
      //   });
      //   cellsResult.push(...partialCells);
      // }

      const partials = await Promise.all(
        rowIdChunks.map(chunk =>
          ctx.db.query.cells.findMany({
            where: (c, { inArray }) => inArray(c.rowId, chunk),
          })
        )
      );
      cellsResult = partials.flat();      
    }

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
      // Create table
      const table = await ctx.db.insert(tables).values({
        name: "New Table",
        baseId: input.baseId,
      }).returning({ id: tables.id });
  
      const tableId = table[0]?.id;
      if (!tableId) throw new Error("Failed to create table");
  
      // Create view
      const view = await ctx.db.insert(views).values({
        name: "Default View",
        tableId,
        filters: [],
        sorts: [],
        hiddenColumns: [],
        searchTerm: "",
      }).returning({ id:views.id })
      const viewId = view[0]?.id;
      if (!viewId) throw new Error("Failed to create view");
  
      // Create columns (text, text, number)
      const colMeta: { id: number; type: "TEXT" | "NUMBER" }[] = [];
      const types: ("TEXT" | "NUMBER")[] = ["TEXT", "TEXT", "NUMBER"];

      for (let i = 1; i <= 6; i++) {
        const type = types[(i - 1) % 3]!;
        const col = await ctx.db.insert(columns).values({
          name: `col_${i}`,
          tableId,
          type,
        }).returning({ id: columns.id });

        if (!col[0]) throw new Error("Failed to insert column");
        colMeta.push({ id: col[0].id, type });
      }

      // Create rows
      const rowIds: number[] = [];
      for (let i = 0; i < 10; i++) {
        const row = await ctx.db.insert(rows).values({
          name: `Row ${i + 1}`,
          tableId,
        }).returning({ id: rows.id });

        if (!row[0]) throw new Error("Failed to insert row");
        rowIds.push(row[0].id);
      }

      // Generate cells
      const faker = await import("@faker-js/faker").then((m) => m.faker);
      const cellData = [];

      for (const rowId of rowIds) {
        for (const col of colMeta) {
          const value =
            col.type === "NUMBER"
              ? faker.number.int({ min: 1, max: 100000 }).toString()
              : faker.person.fullName();

          cellData.push({ rowId, columnId: col.id, value });
        }
      }

      await ctx.db.insert(cells).values(cellData);

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
    
    return { success: true };
  }),

  add100k: protectedProcedure
  .input(z.object({ tableId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    const { tableId } = input;

    // Limit concurrency to 5
    const limit = pLimit(5);

    const existingCols = await ctx.db.query.columns.findMany({
      where: (c, { eq }) => eq(c.tableId, tableId),
    });

    if (existingCols.length === 0) throw new Error("No columns found for the table");

    // Create 100,000 rows
    console.time("Insert rows");
    const rowValues = Array.from({ length: 100000 }, (_, i) => ({
      name: `Row ${i + 1}`,
      tableId,
    }));

    // Insert rows in chunks
    //Math.floor(MAX_PARAMS / existingCols.length)
    const insertedRowsChunks: { id: number }[][] = await Promise.all(
      chunkArray(rowValues, 2000).map((rowChunk) =>
        limit(() => ctx.db.insert(rows).values(rowChunk).returning({ id: rows.id }))
      )
    );
    console.timeEnd("Insert rows");

    // const insertedRows = await ctx.db.insert(rows).values(rowValues).returning({ id: rows.id });
    const insertedRows = insertedRowsChunks.flat();
    const rowIds = insertedRows.map((r) => r.id);

    // Generate cells
    console.time("Generate cells");
    const faker = await import("@faker-js/faker").then((m) => m.faker);
    const cellData: { rowId: number; columnId: number; value: string }[] = [];

    const valueGenerators: Array<() => string> = existingCols.map(col =>
      col.type === "NUMBER"
        ? () => faker.number.int({ min: 1, max: 100000 }).toString()
        : () => faker.person.fullName()
    );    
    console.timeEnd("Generate cells");

    console.time("Insert cells");
    for (const rowId of rowIds) {
      existingCols.forEach((col, i) => {
        if (valueGenerators[i]) {
          cellData.push({
            rowId,
            columnId: col.id,
            value: valueGenerators[i](),
          });
        }        
      });
    }

    // Insert cells in chunks with concurrency limit
    await Promise.all(
      //MAX_PARAMS / 4
      chunkArray(cellData, 1000).map((chunk) =>
        limit(() => ctx.db.insert(cells).values(chunk))
      )
    );
    console.timeEnd("Insert cells");
    

    return { success: true };
  }),
  
}) 