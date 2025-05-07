"use client";

import { UtilPanel } from "./UtilPanel";
import { EyeOff, ChevronDown } from "lucide-react";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

type HideFieldsPanelProps = {
  viewId: number;
  columns: { id: number; name: string }[];
  initialHiddenColumns: number[];
  onToggleColumn: (columnId: number) => void;
};

export default function HideFieldsPanel({
  viewId,
  columns,
  initialHiddenColumns,
  onToggleColumn,
}: HideFieldsPanelProps) {
  const utils = api.useUtils();

  const [hiddenColumns, setHiddenColumns] = useState<number[]>(initialHiddenColumns || []);

  useEffect(() => {
    setHiddenColumns(initialHiddenColumns || []);
  }, [initialHiddenColumns]);  

  const updateViewHiddens = api.view.updateViewHiddens.useMutation({
    onSuccess: async () => {
      await utils.view.getHiddens.invalidate();
      await utils.table.getTableData.invalidate();
    }    
  });

  const handleToggle = (columnId: number) => {
    onToggleColumn(columnId);

    const newHidden = hiddenColumns.includes(columnId)
      ? hiddenColumns.filter((id) => id !== columnId)
      : [...hiddenColumns, columnId];

    setHiddenColumns(newHidden);
    updateViewHiddens.mutate({
      viewId: Number(viewId),
      hiddenColumns: newHidden,
    });
  };

  let bgClass = "bg-white hover:bg-gray-200"
  if (hiddenColumns.length > 0) {
    bgClass = "bg-blue-200 hover:bg-blue-300"
  }

  return (
    <UtilPanel
      trigger={
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${bgClass} transition text-gray-700`}>
          <EyeOff className="w-4 h-4" />
          Hide Fields
          <ChevronDown className="w-4 h-4" />
        </div>
      }
    >
      <h3 className="w-[150px] font-medium mb-2 text-sm text-gray-700">Visible Columns</h3>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {columns.map((col) => (
          <label key={col.id} className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col.id)}
              onChange={() => handleToggle(col.id)}
              className="rounded"
            />
            {col.name || `Column ${col.id}`}
          </label>
        ))}
      </div>
    </UtilPanel>
  );
}
