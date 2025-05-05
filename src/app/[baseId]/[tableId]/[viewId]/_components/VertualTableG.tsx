"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";

import { EditableCell } from "./EditableCell";
import EditableColumnHeader from "./EditableColumnHeader";
import UtilBar from "./UtilBar";

interface Props {
  baseId: number;
  tableId: number;
  viewId: number;
}

/** A single DB row.  We only need id & tableId for keys; cells arrive separately */
type RowType = { id: number; tableId: number };

export function VirtualTable({
  baseId,
  tableId,
  viewId,
}: Props) {
  /* ------------------------------------------------------------------ */
  /* 1. data fetching (unchanged)                                        */
  /* ------------------------------------------------------------------ */
  const hiddenColsQuery = api.view.getHiddens.useQuery({ viewId : Number(viewId) });
  const hiddenInitial   = (hiddenColsQuery.data ?? []) as number[];

  const [hiddenColumns, setHiddenColumns] = useState<number[]>(hiddenInitial);
  const toggleHidden = (id: number) =>
    setHiddenColumns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = api.table.getTableData.useInfiniteQuery(
    { tableId: Number(tableId), limit: 1_000, viewId: Number(viewId) },
    {
      getNextPageParam: (last) => last.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const rows = data?.pages.flatMap((p) => p.rows) ?? [];
  const cols = data?.pages[0]?.columns ?? [];
  const cells = data?.pages.flatMap((p) => p.cells) ?? [];

  /* map rowId+colId → value  */
  const cellMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cells) m.set(`${c.rowId}_${c.columnId}`, c.value);
    return m;
  }, [cells]);

  /* global search term */
  const { data: searchTerm = "" } = api.view.getSearchTerm.useQuery(
    { viewId: Number(viewId) },
    { enabled: !!data },
  );

  /* ------------------------------------------------------------------ */
  /* 2. build TanStack columns                                           */
  /* ------------------------------------------------------------------ */
  const columnDefs: ColumnDef<RowType>[] = useMemo(() => {
    return cols
      .filter((c) => !hiddenColumns.includes(c.id))
      .map((c) => ({
        id: String(c.id),           // column.id must be string
        header: () => (
          <EditableColumnHeader
            name={c.name}
            columnId={c.id}
            tableId={tableId}
            viewId={viewId}
          />
        ),
        size: 200,
        cell: ({ row }) => {
          const value = cellMap.get(`${row.original.id}_${c.id}`) ?? "";
          return (
            <EditableCell
              rowId={row.original.id}
              columnId={c.id}
              value={value}
              tableId={tableId}
              viewId={viewId}
              isFocused={false /* handled inside EditableCell */}
              onTab={() => {}}
              searchTerm={searchTerm!} //!!!
            />
          );
        },
      }));
  }, [cols, hiddenColumns, cellMap, searchTerm]);

  /* row model is trivial because all data lives in the cell renderer */
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    debugTable: false,
  });

  /* ------------------------------------------------------------------ */
  /* 3. virtual rows                                                    */
  /* ------------------------------------------------------------------ */
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  /* infinite scroll trigger */
  useEffect(() => {
    const [last] = rowVirtualizer.getVirtualItems().slice(-1);
    if (
      last &&
      last.index >= rows.length - 300 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), rows.length, hasNextPage]);

  if (isLoading) return <div className="p-4">Loading…</div>;

  /* ------------------------------------------------------------------ */
  /* 4. render                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div
      ref={parentRef}
      className="overflow-auto h-[calc(100vh-6.5rem)] w-full border-t"
    >
      <UtilBar
        baseId={baseId}
        tableId={tableId}
        viewId={viewId}
        hiddenColumns={hiddenColumns}
        columns={cols}
        setHiddenColumns={toggleHidden}
        searchTerm={searchTerm!} // !!!
      />

      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {/* header row */}
        <div className="sticky top-0 z-10 flex bg-gray-100 border-b text-sm font-medium">
          <div className="w-[100px] px-3 py-2 border-r bg-white">#</div>
          {table.getHeaderGroups()[0]?.headers.map((h) => (
            <div
              key={h.id}
              className="border-r border-gray-200"
              style={{ width: h.getSize() }}
            >
              {flexRender(h.column.columnDef.header, h.getContext())}
            </div>
          ))}
          {/* + add-column header */}
          <EditableColumnHeader
            isAddColumn
            tableId={tableId}
            viewId={viewId}
          />
        </div>

        {/* data rows */}
        {rowVirtualizer.getVirtualItems().map((vr) => {
          const row = table.getRowModel().rows[vr.index]!; // !!!
          return (
            <div
              key={row.id}
              className="flex border-t border-gray-200 absolute left-0"
              style={{ transform: `translateY(${vr.start}px)` }}
            >
              <div className="w-[100px] px-3 py-2 border-r bg-gray-50">
                {vr.index + 1}
              </div>
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="border-r border-gray-200"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
              <div className="w-[200px] border-r" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
