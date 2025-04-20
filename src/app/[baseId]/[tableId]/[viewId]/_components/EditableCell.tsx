"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Props = {
  rowId: string;
  columnId: string;
  value: string;
};

export function EditableCell({ rowId, columnId, value }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);

  const utils = api.useUtils();

  const updateCell = api.cell.update.useMutation({
    onSuccess: async () => {
      await utils.table.getTableData.invalidate(); // refresh updated cell
    },
  });

  const handleSave = () => {
    setEditing(false);
    if (input !== value) {
      updateCell.mutate({ rowId, columnId, value: input });
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
