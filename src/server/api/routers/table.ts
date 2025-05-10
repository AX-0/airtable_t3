import { z } from "zod";
import { db } from "~/server/db";

import pLimit from 'p-limit';

const limitConcurrency = pLimit(5);

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { columns, rows, tables, views, cells } from "~/server/db/schema";
import { and, asc, desc, eq, gt, ilike, inArray, isNotNull, isNull, lt, ne, not, or, SQL, sql } from "drizzle-orm";

function chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
}

// const MAX_PARAMS = 65534; // tRPC max num of params

export const tableRouter = createTRPCRouter({
    getTableData: protectedProcedure
    .input(
        z.object({
        tableId: z.number(),
        cursor : z.number().optional(),
        limit  : z.number().default(100),
        viewId : z.number(),
        }),
    )
    .query(async ({ input, ctx }) => {
        // meta
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

        const searchTerm = (view.searchTerm ?? "").trim();

        // col list
        const columnsResult = await ctx.db.query.columns.findMany({
            where  : (c, { eq }) => eq(c.tableId, input.tableId),
            orderBy: (c, { asc }) => asc(c.id),
        });
            const colTypeById = new Map<number, "NUMBER" | "TEXT">(
            columnsResult.map(c => [c.id, c.type]),
        );

        // where
        const whereParts: SQL[] = [eq(rows.tableId, input.tableId)];
        if (input.cursor) whereParts.push(gt(rows.id, input.cursor));

        for (const f of filters) {
        const cId = f.columnId;
        switch (f.operator) {
            case "EQUALS":
                whereParts.push(sql`EXISTS (
                    SELECT 1 FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    AND ${cells.value} = ${f.value}
                )`);
                break;

            case "CONTAINS":
                whereParts.push(sql`EXISTS (
                    SELECT 1 FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    AND ${cells.value} ILIKE ${`%${f.value}%`}
                )`);
                break;

            case "GREATER_THAN":
                whereParts.push(sql`(
                    SELECT NULLIF(${cells.value}, '')::numeric
                    FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    LIMIT 1
                ) > ${Number(f.value)}`);
                break;

            case "LESS_THAN":
                whereParts.push(sql`(
                    SELECT NULLIF(${cells.value}, '')::numeric
                    FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    LIMIT 1
                ) < ${Number(f.value)}`);
                break;

            case "IS_EMPTY":
                whereParts.push(sql`NOT EXISTS (
                    SELECT 1 FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    AND (${cells.value} IS NOT NULL AND ${cells.value} <> '')
                )`);
                break;

            case "IS_NOT_EMPTY":
                whereParts.push(sql`EXISTS (
                    SELECT 1 FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${cId}
                    AND (${cells.value} IS NOT NULL AND ${cells.value} <> '')
                )`);
                break;
        }
        }

        if (searchTerm) {
            whereParts.push(sql`EXISTS (
                SELECT 1 FROM ${cells}
                WHERE ${cells.rowId} = ${rows.id}
                AND lower(${cells.value}) ILIKE ${`%${searchTerm.toLowerCase()}%`}
            )`);
        }

        // order by
        const orderByParts: SQL[] = sorts.map(s => {
            const isNum = colTypeById.get(s.columnId) === "NUMBER";
            const val   = isNum
                ? sql`(
                    SELECT NULLIF(${cells.value}, '')::numeric
                    FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${s.columnId}
                    LIMIT 1
                )`
                : sql`(
                    SELECT ${cells.value}
                    FROM ${cells}
                    WHERE ${cells.rowId} = ${rows.id}
                    AND ${cells.columnId} = ${s.columnId}
                    LIMIT 1
                )`;

            return s.direction === "asc" ? asc(val) : desc(val);
        });
        orderByParts.push(asc(rows.id)); // tie-breaker

        // fetch rows
        const rowsResult = await ctx.db
            .select({
                id     : rows.id,
                name   : rows.name,
                tableId: rows.tableId,
            })
            .from(rows)
            .where(and(...whereParts))
            .orderBy(...orderByParts)
            .limit(input.limit);

        const nextCursor =
        rowsResult.length === input.limit ? rowsResult.at(-1)!.id : undefined;

        // fetch cells
        const rowIds = rowsResult.map(r => r.id);
        let cellsResult: {
            id: number; value: string; rowId: number; columnId: number;
        }[] = [];

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

        return {
            columns : columnsResult,
            rows : rowsResult,
            cells : cellsResult,
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
        ));
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
            chunkArray(cellData, 5000).map((chunk) =>
                limit(() => ctx.db.insert(cells).values(chunk))
            )
        );
        console.timeEnd("Insert cells");
        

        return { success: true };
    }),
    
    deleteTable: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .mutation(async ({ input, ctx }) => {
        const { tableId } = input;

        // get row ids and col ids
        const rowIds = await ctx.db
        .select({ id: rows.id })
        .from(rows)
        .where(eq(rows.tableId, tableId))
        .then(r => r.map(x => x.id));

        const colIds = await ctx.db
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.tableId, tableId))
        .then(r => r.map(x => x.id));

        // delete cells
        if (rowIds.length) {
        await Promise.all(
            chunkArray(rowIds, 2000).map(chunk =>
            limitConcurrency(() =>
                ctx.db
                .delete(cells)
                .where(inArray(cells.rowId, chunk)),
            ),
            ),
        );
        }

        // delete rows
        if (rowIds.length) {
        await Promise.all(
            chunkArray(rowIds, 2000).map(chunk =>
            limitConcurrency(() =>
                ctx.db.delete(rows).where(inArray(rows.id, chunk)),
            ),
            ),
        );
        }

        // delete cols
        if (colIds.length) {
        await Promise.all(
            chunkArray(colIds, 1000).map(chunk =>
            limitConcurrency(() =>
                ctx.db.delete(columns).where(inArray(columns.id, chunk)),
            ),
            ),
        );
        }

        // delete views
        await ctx.db.delete(views).where(eq(views.tableId, tableId));

        // delete table
        await ctx.db.delete(tables).where(eq(tables.id, tableId));

        return { success: true };
    }),

    updateTable: protectedProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().min(1),
        })
        )
        .mutation(async ({ ctx, input }) => {
        return await db
            .update(tables)
            .set({ name: input.name })
            .where(eq(tables.id, input.id));
    }),
}) 