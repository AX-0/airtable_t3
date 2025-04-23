"use client";

import { useState } from "react";
import { UtilPanel } from "./UtilPanel";

type HideFieldsPanelProps = {
  columns: { id: number; name: string }[];
  hiddenColumns: number[];
  onToggleColumn: (columnId: number) => void;
};

export default function HideFieldsPanel({
  columns,
  hiddenColumns,
  onToggleColumn,
}: HideFieldsPanelProps) {
  return (
    <UtilPanel
      trigger={<button className="text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md">Hide Fields</button>}
    >
      <h3 className="font-medium mb-2 text-sm text-gray-700">Visible Columns</h3>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {columns.map((col) => (
          <label key={col.id} className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col.id)}
              onChange={() => onToggleColumn(col.id)}
              className="rounded"
            />
            {col.name || `Column ${col.id}`}
          </label>
        ))}
      </div>
    </UtilPanel>
  );
}
