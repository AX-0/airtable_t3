"use client";

import { Hash, Plus, Text } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";

type Props = {
  columnId?: number;
  name?: string;
  tableId: number;
  isAddColumn?: boolean;
  viewId: number;
};

export default function EditableColumnHeader({ columnId, name, tableId, isAddColumn, viewId }: Props) {
  const [editing, setEditing] = useState(isAddColumn ?? false);
  const [input, setInput] = useState(() => (isAddColumn ? "" : name ?? ""));
  const [type, setType] = useState<"TEXT" | "NUMBER">("TEXT");

  const inputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const createColumn = api.column.createColumn.useMutation({
    onSuccess: () => utils.table.getTableData.invalidate(),
  });

  const { data: colType } = !isAddColumn && columnId !== undefined
  ? api.column.getType.useQuery({ columnId: Number(columnId) })
  : { data: undefined };

  const createColumnIsPending = createColumn.isPending;

  const updateColumn = api.column.updateColumnName.useMutation({
    onMutate: async ({ columnId, name, tableId }) => {
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
            columns: page.columns.map((col) =>
              col.id === columnId ? { ...col, name } : col
            ),
          })),
        };
      });

      void utils.table.getTableData.invalidate();

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
      // void utils.table.getTableData.invalidate();
    },
  });

//   useEffect(() => {
//     if (!editing) {
//       setInput(name ?? "");
//     }
//   }, [name, editing]);

  const handleSave = () => {
    setEditing(false);
    if (!input.trim()) return;

    console.log(type);
  
    if (isAddColumn) {
      // console.log(type);
      createColumn.mutate({ name: input, type, tableId: Number(tableId) });
    } else if (columnId && input != name) {
      updateColumn.mutate({ columnId, name: input, tableId: Number(tableId) });
    }
  };

  // console.log(input);
  // console.log(type)

  // console.log("input" + input)
  // console.log(name)
  
  return (
    <div
      className="w-[200px] px-3 py-2 border-r bg-gray-200 text-sm font-medium text-gray-700"
      onClick={() => setEditing(true)}
    >
      {editing ? (
        <>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          className="w-full border px-1 py-0.5 rounded text-sm"
        />

        {isAddColumn && (
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "TEXT" | "NUMBER")}
            className="w-full border px-1 py-0.5 rounded text-sm"
          >
            <option value="TEXT">Text</option>
            <option value="NUMBER">Number</option>
          </select>
        )}
        </>
      ) : (
        <span>
          {createColumnIsPending ? (
            "Adding..."
          ) : (
            isAddColumn ? (
              <Plus className="w-4 h-4 inline" />
            ) : (
              <>
                {colType === "NUMBER" ? (
                  <Hash className="w-4 h-4 inline mr-1" />
                ) : (
                  <Text className="w-4 h-4 inline mr-1" />
                )}
                {input}
              </>
            )
          )}
        </span>
      )}
    </div>
  );
}