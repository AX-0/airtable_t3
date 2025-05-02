"use client";

import { ChevronDown, ArrowUpDown, Trash } from "lucide-react";
import { UtilPanel } from "./UtilPanel";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

type Props = {
  tableId: number;
  viewId: number;
};

type SortCondition = {
  columnId: number | null;
  direction: "asc" | "desc";
};

export default function SortPanel({ tableId, viewId }: Props) {
  const { data: columns = [] } = api.column.getAllColNameId.useQuery({
    tableId: Number(tableId),
  });

  const { data: fetchedSorts = [] } = api.view.getSorts.useQuery({
    viewId: Number(viewId),
  }) as { data: SortCondition[] };

  const utils = api.useUtils();
  const [sorts, setSorts] = useState<SortCondition[]>([]);

  useEffect(() => {
    setSorts(fetchedSorts);
  }, [fetchedSorts]);

  const updateViewSorts = api.view.updateViewSorts.useMutation({
    onSuccess: () => void utils.table.getTableData.invalidate(),
  });

  const deleteSort = api.view.deleteSort.useMutation({
    onSuccess: () => {
      void utils.table.getTableData.invalidate();
      void utils.view.getSorts.invalidate();
    },
  });

  const dirOptions = (colType?: string) =>
    colType === "NUMBER"
      ? [
          { value: "asc", label: "1 → 9" },
          { value: "desc", label: "9 → 1" },
        ]
      : [
          { value: "asc", label: "A → Z" },
          { value: "desc", label: "Z → A" },
        ];

  const persist = (next: SortCondition[]) =>
    updateViewSorts.mutate({
      viewId: Number(viewId),
      sorts: next.filter(s => s.columnId !== null) as {
        columnId: number;
        direction: "asc" | "desc";
      }[],
    });

  return (
    <UtilPanel
      trigger={
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
          <ArrowUpDown className="w-4 h-4" />
          Sort
          <ChevronDown className="w-4 h-4" />
        </div>
      }
    >
      <div className="w-[300px] text-sm text-gray-700 space-y-4">
        <div className="font-semibold">Sort records by</div>

        {sorts.map((sort, index) => {
          const selectedColumn = columns.find(c => c.id === sort.columnId);

          return (
            <div key={index} className="flex items-center gap-2">
              then by

              {/* column select */}
              <select
                className="border rounded px-2 py-1"
                value={sort.columnId ?? ""}
                onChange={e => {
                  const next = [...sorts];
                  if (next[index]) next[index].columnId = Number(e.target.value);
                  setSorts(next);
                  persist(next);
                }}
              >
                <option value="" disabled>
                  Select column
                </option>
                {columns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>

              {/* direction select */}
              <select
                className="border rounded px-2 py-1"
                value={sort.direction}
                onChange={e => {
                  const next = [...sorts];
                  if (next[index]) next[index].direction = e.target.value as
                    | "asc"
                    | "desc";
                  setSorts(next);
                  persist(next);
                }}
              >
                {dirOptions(selectedColumn?.type).map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* delete */}
              <button
                className="text-red-600"
                onClick={() => {
                  const target = sorts[index]!;
                  if (target.columnId == null) return;
                  deleteSort.mutate({
                    viewId: Number(viewId),
                    sort: {
                      columnId: target.columnId,
                      direction: target.direction,
                    },
                  });
                  setSorts(prev => prev.filter((_, i) => i !== index));
                }}
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {/* add sort level */}
        <button
          className="text-blue-600 text-sm cursor-pointer"
          onClick={() =>
            setSorts(prev => [
              ...prev,
              { columnId: null, direction: "asc" },
            ])
          }
        >
          + Add sort
        </button>
      </div>
    </UtilPanel>
  );
}
