"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

type Props = {
  rowId: number;
  columnId: number;
  value: string;
  tableId: number;
  isFocused: boolean;
  onTab: (direction: "next" | "prev", rowId: number, columnId: number) => void;
  viewId: number;
};

export function EditableCell({
  rowId,
  columnId,
  value,
  tableId,
  isFocused,
  onTab,
  viewId,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const updateCell = api.cell.update.useMutation({
    onMutate: ({ rowId, columnId, value }) => {
      const prevData = utils.table.getTableData.getInfiniteData({
        tableId,
        viewId: Number(viewId)
      });

      utils.table.getTableData.setInfiniteData({
        tableId,
        viewId: Number(viewId)
      }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            cells: page.cells.map((cell) =>
              cell.rowId === rowId && cell.columnId === columnId
                ? { ...cell, value }
                : cell
            ),
          })),
        };
      });

      return { prevData };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevData) {
        utils.table.getTableData.setInfiniteData({
          tableId,
          viewId: Number(viewId)
        }, ctx.prevData);
      }
    },
    onSettled: () => {
      void utils.table.getTableData.invalidate();
    },
  });

  useEffect(() => {
    if (isFocused) {
      setEditing(true);
      inputRef.current?.focus();
    }
  }, [isFocused]);

  const handleSave = () => {
    setEditing(false);
    if (input !== value) {
      updateCell.mutate({ rowId, columnId, value: input, tableId: Number(tableId) });
    }
  };

  return (
    <div
      className="w-[200px] px-3 py-2 text-sm text-gray-800 border-r border-gray-200 overflow-hidden whitespace-nowrap text-ellipsis"
      onClick={() => setEditing(true)}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={input}
          autoFocus
          onChange={(e) => setInput(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Tab") {
              e.preventDefault();
              handleSave();
              onTab(e.shiftKey ? "prev" : "next", rowId, columnId);
            }
          }}
          className="w-full border px-1 py-0.5 rounded text-sm"
        />
      ) : (
        <span>{input}</span>
      )}
    </div>
  );
}
