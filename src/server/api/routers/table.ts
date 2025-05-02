import { z } from "zod";
import { db } from "~/server/db";

import pLimit from 'p-limit';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { columns, rows, tables, views, cells } from "~/server/db/schema";
import { and, asc, desc, eq, gt, ilike, inArray, isNotNull, isNull, lt, ne, not, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

const MAX_PARAMS = 65534; // tRPC max num of params

export const tableRouter = createTRPCRouter({
  getTableData: protectedProcedure
  .input(
    z.object({
      tableId : z.number(),
      cursor  : z.number().optional(),
      limit   : z.number().default(100),
      viewId  : z.number(),
    }),
  )
  .query(async ({ input, ctx }) => {
    // ─────────────────────────────── view meta ────────────────────────────────
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
    if (!view) throw new Error("View not found");

    const filters = (view.filters ?? []) as {
      columnId: number; operator: string; value: string;
    }[];
    const sorts = (view.sorts ?? []) as {
      columnId: number; direction: "asc" | "desc";
    }[];

    // ───────────────────────────── column list ───────────────────────────────
    const columnsResult = await ctx.db.query.columns.findMany({
      where  : (c, { eq }) => eq(c.tableId, input.tableId),
      orderBy: (c, { asc }) => asc(c.id),
    });

    // ────────────────────────────── filtering ────────────────────────────────
    let filteredRowIds: number[] | null = null;
    if (filters.length) {
      const sets: Set<number>[] = [];

      for (const { columnId, operator, value } of filters) {
        let cond;
        switch (operator) {
          case "EQUALS":
            cond = and(eq(cells.columnId, columnId), eq(cells.value, value));          break;
          case "CONTAINS":
            cond = and(eq(cells.columnId, columnId), ilike(cells.value, `%${value}%`));break;
          case "GREATER_THAN":
            cond = and(eq(cells.columnId, columnId), gt(sql`(${cells.value})::numeric`, Number(value))); break;
          case "LESS_THAN":
            cond = and(eq(cells.columnId, columnId), lt(sql`(${cells.value})::numeric`, Number(value))); break;
          case "IS_EMPTY":
            cond = and(eq(cells.columnId, columnId), or(isNull(cells.value), eq(cells.value, "")));     break;
          case "IS_NOT_EMPTY":
            cond = and(eq(cells.columnId, columnId), and(isNotNull(cells.value), ne(cells.value, ""))); break;
          default:
            continue;
        }

        const matched = await ctx.db
          .selectDistinct({ rowId: cells.rowId })
          .from(cells)
          .where(cond);

        sets.push(new Set(matched.map(m => m.rowId)));
      }

      if (sets.length) {
        let inter = sets[0]!;
        for (const s of sets.slice(1)) inter = new Set([...inter].filter(x => s.has(x)));
        filteredRowIds = [...inter];
      }
    }

    const idFilterClause =
      filteredRowIds?.length
        ? or(...chunkArray(filteredRowIds, 1000).map(chunk => inArray(rows.id, chunk)))
        : undefined;

    // ──────────────────────── dynamic sort joins / ORDER BY ──────────────────
    const sortAliases = sorts.map((s, i) => ({
      tbl       : alias(cells, `sort_cell_${i}`),
      columnId  : s.columnId,
      direction : s.direction,
    }));

    /** build SELECT … FROM rows */
    const baseSelect = ctx.db
      .select({
        id      : rows.id,
        name    : rows.name,
        tableId : rows.tableId,
      })
      .from(rows);

    //------------------------------------------------------------------
    // STEP ❶  build ORDER-BY list with correlated sub-queries
    //------------------------------------------------------------------
    // helper that produces   asc( …subquery… )   or   desc( …subquery… )
      function sortExpr(
        colId: number,
        dir: "asc" | "desc",
      ) {
        // sub-query that pulls the cell’s value for the current row
        const sub = sql`(
          SELECT ${cells.value}
          FROM ${cells}
          WHERE ${cells.rowId} = ${rows.id}
            AND ${cells.columnId} = ${colId}
          LIMIT 1
        )`;

        return dir === "asc" ? asc(sub) : desc(sub);
      }

      const orderByArgs = sorts.map(s => sortExpr(s.columnId, s.direction));
      orderByArgs.push(asc(rows.id));      // deterministic tie-breaker


    // ──────────────────────────────── query rows ─────────────────────────────
    const rowsResult = await ctx.db
    .select({
      id      : rows.id,
      name    : rows.name,
      tableId : rows.tableId,
    })
    .from(rows)
    .where(
      and(
        eq(rows.tableId, input.tableId),
        input.cursor ? gt(rows.id, input.cursor) : undefined,
        idFilterClause,                  // ← your existing filter clause
      ),
    )
    .orderBy(...orderByArgs)
    .limit(input.limit);

    const nextCursor =
      rowsResult.length === input.limit ? rowsResult.at(-1)!.id : undefined;

    // ─────────────────────────────── fetch cells ─────────────────────────────
    let cellsResult: { id: number; value: string; rowId: number; columnId: number }[] = [];
    const rowIds = rowsResult.map(r => r.id);

    if (rowIds.length) {
      const parts = await Promise.all(
        chunkArray(rowIds, 1000).map(chunk =>
          ctx.db.query.cells.findMany({
            where: (c, { inArray }) => inArray(c.rowId, chunk),
          }),
        ),
      );
      cellsResult = parts.flat();
    }

    // ──────────────────────────────── return ────────────────────────────────
    return {
      columns   : columnsResult,
      rows      : rowsResult,
      cells     : cellsResult,
      nextCursor,
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