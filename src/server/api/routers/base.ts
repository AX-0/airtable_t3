import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { bases, tables, cells, rows, columns, views } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";

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
  
      // Step 1: Find all tables under the base
      const tableRecords = await ctx.db
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.baseId, baseId));
  
      const tableIds = tableRecords.map((t) => t.id);
  
      // Step 2: Delete all related data per table
      for (const tableId of tableIds) {
        // Delete cells (must be before rows and columns)
        const rowIds = await ctx.db
          .select({ id: rows.id })
          .from(rows)
          .where(eq(rows.tableId, tableId));
        const colIds = await ctx.db
          .select({ id: columns.id })
          .from(columns)
          .where(eq(columns.tableId, tableId));
  
        await ctx.db
          .delete(cells)
          .where(
            and(
              inArray(cells.rowId, rowIds.map((r) => r.id)),
              inArray(cells.columnId, colIds.map((c) => c.id))
            )
          );
  
        // Delete rows
        await ctx.db.delete(rows).where(eq(rows.tableId, tableId));
  
        // Delete columns
        await ctx.db.delete(columns).where(eq(columns.tableId, tableId));
  
        // Delete views
        await ctx.db.delete(views).where(eq(views.tableId, tableId));
      }
  
      // Step 3: Delete tables
      await ctx.db.delete(tables).where(inArray(tables.id, tableIds));
  
      // Step 4: Delete the base itself
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
  
      // Create cols
      const colIds = [];
      for (let i = 1; i <= 5; i++) { // 5 cols
        const col = await ctx.db.insert(columns).values({
          name: `col_${i}`,
          tableId,
        }).returning({ id: columns.id });

        if (!col[0]) throw new Error("Failed to insert column");
        colIds.push(col[0].id);
      }
  
      // Create rows
      const rowIds = [];
      for (let i = 0; i < 10; i++) { // 10 rows
        const row = await ctx.db.insert(rows).values({
          name: `Row ${i + 1}`,
          tableId,
        }).returning({ id: rows.id });

        if (!row[0]) throw new Error("Failed to insert column");
        rowIds.push(row[0].id);
      }
  
      // Create and populate cells
      const faker = await import("@faker-js/faker").then((m) => m.faker);
      const cellData = [];
  
      for (const rowId of rowIds) {
        for (const colId of colIds) {
          const value = faker.helpers.arrayElement([
            faker.person.fullName(),
            faker.number.int({ min: 1, max: 1000 }).toString(),
          ]);
          cellData.push({ rowId, columnId: colId, value });
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