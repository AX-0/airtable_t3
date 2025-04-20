"use client";

import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { api } from "~/trpc/react";
import { EditableCell } from "./EditableCell";

type Props = {
  tableId: number;
};

export function VirtualTable({ tableId }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = api.table.getTableData.useQuery({ tableId: tableId.toString() });

  const columns = data?.columns ?? [];
  const rows = data?.rows ?? [];
  const cells = data?.cells ?? [];

  const cellMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cell of cells) {
      map.set(`${cell.rowId}_${cell.columnId}`, cell.value);
    }
    return map;
  }, [cells]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  if (isLoading) return <div className="p-4 text-gray-600">Loading table...</div>;

  return (
    <div ref={parentRef} className="overflow-auto h-full w-full border-t">
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}
      >
        {/* Header Row */}
        <div className="sticky top-0 z-10 flex bg-gray-100 border-b border-gray-300 text-sm text-gray-700 font-medium">
          <div className="w-[60px] px-3 py-2 border-r bg-white text-center">#</div>
          {columns.map((col) => (
            <div
              key={col.id}
              className="min-w-[200px] px-3 py-2 border-r bg-white"
            >
              {col.name}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;

          return (
            <div
              key={row.id}
              className="flex absolute left-0 w-full border-t border-gray-200"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >

            <div className="w-[60px] px-3 py-2 border-r text-center bg-gray-50">
              {virtualRow.index + 1}
            </div>

            {columns.map((col) => {
              const cellKey = `${row.id}_${col.id}`;
              const value = cellMap.get(cellKey) ?? "";

              return (
                <EditableCell
                  key={col.id}
                  rowId={row.id.toString()}
                  columnId={col.id.toString()}
                  value={value}
                />
              );
            })}
            
            </div>
          );
        })}
      </div>
    </div>
  );
}
