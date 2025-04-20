"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Props = {
  rowId: number;
  columnId: number;
  value: string;
  tableId: number;
};

export function EditableCell({ rowId, columnId, value, tableId }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);

  const utils = api.useUtils();

  const updateCell = api.cell.update.useMutation({
    onMutate: async ({ rowId, columnId, value, tableId }) => {
      await utils.table.getTableData.cancel();
  
      const prevData = utils.table.getTableData.getData({ tableId });
  
      utils.table.getTableData.setData({ tableId }, (old) => {
        if (!old) return old;
  
        const newCells = old.cells.map((cell) => {
          if (cell.rowId === rowId && cell.columnId === columnId) {
            return { ...cell, value };
          }
          return cell;
        });
  
        return { ...old, cells: newCells };
      });
  
      return { prevData };
    },

    // Rollback if failed
    onError: (_err, _variables, context) => {
      if (context?.prevData) {
        utils.table.getTableData.setData({ tableId }, context.prevData);
      }
    },
    // Refresh just in case
    onSettled: async () => {
      await utils.table.getTableData.invalidate();
    },
  });
  

  const handleSave = () => {
    setEditing(false);
    if (input !== value) {
      void updateCell.mutate({
        rowId, columnId, value: input,
        tableId: tableId
      });
    }
  };

  return (
    <div
      className="w-[200px] px-3 py-2 text-sm text-gray-800 border-r border-gray-200 overflow-hidden whitespace-nowrap text-ellipsis"
      onClick={() => setEditing(true)}
    >

    {editing ? (
      <input
        value={input}
        autoFocus
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        className="w-full border px-1 py-0.5 rounded text-sm"
      />
    ) : (
      <span>{value}</span>
    )}

    </div>
  );
}
