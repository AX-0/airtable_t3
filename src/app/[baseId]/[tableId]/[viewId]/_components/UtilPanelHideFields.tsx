"use client";

import { useState } from "react";
import { UtilPanel } from "./UtilPanel";
import { EyeOff, ChevronDown } from "lucide-react";

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
      trigger={
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
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
