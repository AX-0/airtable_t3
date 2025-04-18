import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cells } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export const cellRouter = createTRPCRouter({
    update: protectedProcedure
      .input(z.object({
        rowId: z.string(),
        columnId: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db
          .update(cells)
          .set({ value: input.value })
          .where(
            and(eq(cells.rowId, Number(input.rowId)), eq(cells.columnId, Number(input.columnId)))
          );
      }),
  });
  