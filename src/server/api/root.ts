// import { postRouter } from "~/server/api/routers/post";
import { baseRouter } from "~/server/api/routers/base";
import { tableRouter } from "~/server/api/routers/table";
import { cellRouter } from "~/server/api/routers/cell";
import { viewRouter } from "~/server/api/routers/view";
import { columnRouter } from "~/server/api/routers/column";
import { rowRouter } from "~/server/api/routers/row";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // post: postRouter,
  base: baseRouter,
  table: tableRouter,
  cell: cellRouter,
  view: viewRouter,
  column: columnRouter,
  row: rowRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
