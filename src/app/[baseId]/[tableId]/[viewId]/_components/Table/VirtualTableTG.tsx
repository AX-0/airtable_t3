"use client";

import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import { makeColumnDefs, type DbRow } from "./columns";
import { useTableData } from "./useTableData";

interface Props {
  baseId: number;
  tableId: number;
  viewId: number;
}

export default function VirtualTable(props: Props) {
  /* 1 .  data -------------------------------------------------------- */
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useTableData(props.tableId, props.viewId);

  const rows: DbRow[] = useMemo(
    () => data?.pages.flatMap((p) => p.rows as DbRow[]) ?? [],
    [data],
  );
  const cols = data?.pages[0]?.columns ?? [];

  /* 2 .  table instance --------------------------------------------- */
  const columnDefs: ColumnDef<DbRow>[] = useMemo(
    () => makeColumnDefs(cols),
    [cols],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  /* 3 .  virtualization --------------------------------------------- */
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

  /* 4 .  render ------------------------------------------------------ */
  return (
    <div
      ref={parentRef}
      className="overflow-auto h-[calc(100vh-6.5rem)] border-t"
    >
      {/* --- header row ------------------------------------------------ */}
      <div className="sticky top-0 z-10 flex bg-gray-100 border-b text-sm font-medium">
        {table.getHeaderGroups()[0]?.headers.map((h) => (
          <div
            key={h.id}
            className="border-r border-gray-200"
            style={{ width: h.getSize() }}
          >
            {flexRender(h.column.columnDef.header, h.getContext())}
          </div>
        ))}
      </div>

      {/* --- data rows ------------------------------------------------- */}
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((vr) => {
          const row = table.getRowModel().rows[vr.index]!;
          return (
            <div
              key={row.id}
              className="flex border-t border-gray-200 absolute left-0"
              style={{ transform: `translateY(${vr.start}px)` }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="border-r border-gray-200"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
