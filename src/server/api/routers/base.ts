import { z } from "zod";
import { db } from "~/server/db";

import pLimit from "p-limit";

const limit = pLimit(5);

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

export const baseRouter = createTRPCRouter({
    getBases: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const allBases = await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.ownerId, userId));
  
      return allBases;
    }),

    createBase: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        await db.insert(bases).values({
            name: input.name,
            ownerId: ctx.session.user.id,
        });
    }),

    updateBase: protectedProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().min(1),
        })
        )
        .mutation(async ({ ctx, input }) => {
        return await db
            .update(bases)
            .set({ name: input.name })
            .where(eq(bases.id, input.id));
    }),

    deleteBase: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const baseId = input.id;

      // Find all tables under the base
      const tableRecords = await ctx.db
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.baseId, baseId));

      const tableIds = tableRecords.map((t) => t.id);

      // Delete all related data per table
      for (const tableId of tableIds) {
        const rowIds = await ctx.db
          .select({ id: rows.id })
          .from(rows)
          .where(eq(rows.tableId, tableId))
          .then((res) => res.map((r) => r.id));

        const colIds = await ctx.db
          .select({ id: columns.id })
          .from(columns)
          .where(eq(columns.tableId, tableId))
          .then((res) => res.map((c) => c.id));

        // Delete cells in chunks concurrently
        console.time("Delete Cells")
        await Promise.all(
          chunkArray(rowIds, 2000).flatMap((rowChunk) =>
            chunkArray(colIds, 100).map((colChunk) =>
              limit(() =>
                ctx.db.delete(cells).where(
                  and(
                    inArray(cells.rowId, rowChunk),
                    inArray(cells.columnId, colChunk)
                  )
                )
              )
            )
          )
        );
        console.timeEnd("Delete Cells")

        console.time("Delete Rows")
        // Delete rows in chunks concurrently
        await Promise.all(
          chunkArray(rowIds, 2000).map((chunk) =>
            limit(() => ctx.db.delete(rows).where(inArray(rows.id, chunk)))
          )
        );

        console.timeEnd("Delete Rows")

        // Delete columns in chunks concurrently
        await Promise.all(
          chunkArray(colIds, 1000).map((chunk) =>
            limit(() => ctx.db.delete(columns).where(inArray(columns.id, chunk)))
          )
        );

        // Delete views
        await limit(() => ctx.db.delete(views).where(eq(views.tableId, tableId)));
      }

      // Delete tables in chunks concurrently
      await Promise.all(
        chunkArray(tableIds, 100).map((chunk) =>
          limit(() => ctx.db.delete(tables).where(inArray(tables.id, chunk)))
        )
      );

      // Delete the base
      await ctx.db.delete(bases).where(eq(bases.id, baseId));

      return { success: true };
    }),

    createBaseDefault: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { name } = input;

      // Create base
      const [base] = await ctx.db.insert(bases).values({
        name,
        ownerId: ctx.session.user.id,
      }).returning({ id: bases.id });

      const baseId = base?.id;
      if (!baseId) throw new Error("Failed to create base");
  
      // Create table
      const table = await ctx.db.insert(tables).values({
        name: "Default Table",
        baseId,
      }).returning({ id: tables.id });
  
      const tableId = table[0]?.id;
      if (!tableId) throw new Error("Failed to create table");
  
      // Create view
      await ctx.db.insert(views).values({
        name: "Default View",
        tableId,
        filters: [],
        sorts: [],
        hiddenColumns: [],
        searchTerm: "",
      });
  
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
    }),

    getFirstTableAndView: protectedProcedure
      .input(z.object({ baseId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const [table] = await ctx.db
          .select({ id: tables.id })
          .from(tables)
          .where(eq(tables.baseId, input.baseId))
          .limit(1);

        if (!table) throw new Error("No table found");

        const [view] = await ctx.db
          .select({ id: views.id })
          .from(views)
          .where(eq(views.tableId, table.id))
          .limit(1);

        if (!view) throw new Error("No view found");

        return { tableId: table.id, viewId: view.id };
      }),

    getAllTableIdName: protectedProcedure
      .input(z.object({ baseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return ctx.db.query.tables.findMany({
          where: (tables, { eq }) => eq(tables.baseId, input.baseId),
          columns: {
            id: true,
            name: true,
          },
        });
      }),
  });