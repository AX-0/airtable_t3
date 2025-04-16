import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { bases } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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
        .input(z.object({id: z.number()}))
        .mutation(async ({ctx, input}) => {
            return await db.delete(bases).where(eq(bases.id, input.id));
        })
  });