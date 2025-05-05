import { api } from "~/trpc/react";

export function useTableData(tableId: number, viewId: number, pageSize = 1000) {
  return api.table.getTableData.useInfiniteQuery(
    { tableId: Number(tableId), viewId: Number(viewId), limit: pageSize },
    {
      getNextPageParam: (last) => last.nextCursor,
      refetchOnWindowFocus: false,
    },
  );
}
