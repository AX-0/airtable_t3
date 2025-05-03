import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { views } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const viewRouter = createTRPCRouter({
  getFirstView: protectedProcedure
  .input(z.object({ tableId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.tableId, input.tableId),
      orderBy: (v) => v.id, // lowest id first
    });

    if (!view) throw new Error("No view found");

    return { tableId: input.tableId, viewId: view.id };
  }),

  getAllView: protectedProcedure
  .input(z.object({ tableId: z.number() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.query.views.findMany({
      where: (v, { eq }) => eq(v.tableId, input.tableId),
      orderBy: (v) => v.id,
    });
  }),

  createView: protectedProcedure
  .input(z.object({
    tableId: z.number(),
    name: z.string().min(1).max(100),
  }))
  .mutation(async ({ input, ctx }) => {
    const [newView] = await ctx.db.insert(views).values({
      tableId: input.tableId,
      name: input.name,
      filters: [],
      sorts: [],
      hiddenColumns: [],
      searchTerm: "",
    }).returning();
    
    if (!newView) {
      throw new Error("Failed to create view");
    }
    
    return newView;
  }),

  updateViewFilters: protectedProcedure
  .input(z.object({
    viewId: z.number(),
    filters: z.array(z.object({
      columnId: z.number(),
      operator: z.string(),
      value: z.string(),
    })),
  }))
  .mutation(async ({ input, ctx }) => {
    await ctx.db.update(views)
      .set({ filters: input.filters })
      .where(eq(views.id, input.viewId));
    return { success: true };
  }),

  getFilters: protectedProcedure
  .input(z.object({
    viewId: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });

    if (!view) {
      throw new Error("View not found");
    }

    return view.filters;
  }),

  deleteFilter: protectedProcedure
  .input(z.object({
    viewId: z.number(),
    filter: z.object({
      columnId: z.number(),
      operator: z.string(),
      value: z.string(),
    }),
  }))
  .mutation(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
  
    if (!view) {
      throw new Error("View not found");
    }
  
    // Cast filters properly
    const filters = (view.filters ?? []) as {
      columnId: number;
      operator: string;
      value: string;
    }[];
  
    const updatedFilters = filters.filter((f) => {
      return !(f.columnId === input.filter.columnId && f.operator === input.filter.operator && f.value === input.filter.value);
    });
  
    await ctx.db.update(views)
      .set({ filters: updatedFilters })
      .where(eq(views.id, input.viewId));
  
    return { success: true };
  }),  

  updateViewHiddens: protectedProcedure
  .input(z.object({
    viewId: z.number(),
    hiddenColumns: z.array(z.number()),
  }))
  .mutation(async ({ input, ctx }) => {
    await ctx.db.update(views)
      .set({ hiddenColumns: input.hiddenColumns })
      .where(eq(views.id, input.viewId));
    return { success: true };
  }),

  getHiddens: protectedProcedure
  .input(z.object({
    viewId: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });

    if (!view) {
      throw new Error("View not found");
    }

    return view.hiddenColumns;
  }),

  getSorts: protectedProcedure
  .input(z.object({ viewId: z.number() }))
  .query(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
    if (!view) throw new Error("View not found");
    return view.sorts;
  }),

  updateViewSorts: protectedProcedure
  .input(
    z.object({
      viewId: z.number(),
      sorts: z.array(
        z.object({
          columnId: z.number(),
          direction: z.enum(["asc", "desc"]),
        }),
      ),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(views)
      .set({ sorts: input.sorts })
      .where(eq(views.id, input.viewId));
    return { success: true };
  }),

  deleteSort: protectedProcedure
  .input(
    z.object({
      viewId: z.number(),
      sort: z.object({
        columnId: z.number(),
        direction: z.enum(["asc", "desc"]),
      }),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
    if (!view) throw new Error("View not found");

    const current = (view.sorts ?? []) as {
      columnId: number;
      direction: "asc" | "desc";
    }[];

    const updated = current.filter(
      s =>
        !(
          s.columnId === input.sort.columnId &&
          s.direction === input.sort.direction
        ),
    );

    await ctx.db
      .update(views)
      .set({ sorts: updated })
      .where(eq(views.id, input.viewId));

    return { success: true };
  }),

  updateViewSearch: protectedProcedure
  .input(
    z.object({
      viewId: z.number(),
      search: z.string().max(256),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(views)
      .set({ searchTerm: input.search.trim() })
      .where(eq(views.id, input.viewId));

    return { success: true };
  }),

  getSearchTerm: protectedProcedure
  .input(z.object({ viewId: z.number() }))
  .query(async ({ input, ctx }) => {
    const view = await ctx.db.query.views.findFirst({
      where: (v, { eq }) => eq(v.id, input.viewId),
    });
    if (!view) throw new Error("View not found");
    return view.searchTerm;
  }),
}) 