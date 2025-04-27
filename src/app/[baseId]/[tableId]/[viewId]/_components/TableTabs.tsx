"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Grid2x2Plus, Plus, Search, Trash2 } from "lucide-react";
import CreateTableModal from "./TableTabsCreateTable";

type TableTabsProps = {
  baseId: number;
  selectedTableId: number;
  viewId: number;
};

export default function TableTabs({ baseId, selectedTableId, viewId }: TableTabsProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: tables = [], isLoading } = api.base.getAllTableIdName.useQuery({
    baseId: Number(baseId),
  });

  const getFirstView = api.view.getFirstView.useMutation({
    onSuccess: ({ viewId, tableId }) => {
      router.push(`/${baseId}/${tableId}/${viewId}`);
    },
  });

  const add1kRows = api.table.add1k.useMutation({
    onSuccess: async () => {
      await utils.table.getTableData.invalidate();
      router.refresh();
    },
  });

  const add100kRows = api.table.add100k.useMutation({
    onSuccess: async () => {
      await utils.table.getTableData.invalidate();
      router.refresh();
    },
  });

  // const isPending = add1kRows.isPending;
  const isPending = add100kRows.isPending;

  console.log(selectedTableId);

  return (
    <>
      <div className="sticky flex items-center h-10 px-4 py-0.5 border-b bg-gray-200 shadow-sm">
        <div className="flex gap-2">
          {isLoading ? (
            <span className="text-sm text-gray-500">...</span>
          ) : (
            tables.map((table) => (
              <button
                key={table.id}
                onClick={() => getFirstView.mutate({ tableId: table.id })}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition 
                  ${
                    Number(table.id) === Number(selectedTableId)
                    ? "bg-black text-white"
                    : "text-black bg-white cursor-pointer"
                  }
                `}
              >
                {table.name ?? `Table ${table.id}`}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center px-4 py-1 bg-white rounded-full">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
            />
          </div>

          <button
            // onClick={() => setOpen(true)}
            className="px-3 py-1.5 text-sm rounded-full text-red-600 hover:bg-gray-200 transition cursor-pointer"
          >
            <Trash2 />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="px-3 py-1.5 text-sm rounded-full text-blue-600 hover:bg-gray-200 transition cursor-pointer"
          >
            <Plus />
          </button>

          <button
            // onClick={() => add1kRows.mutate({tableId: Number(selectedTableId)})}
            onClick={() => add100kRows.mutate({tableId: Number(selectedTableId)})}
            className="px-3 py-1.5 text-sm rounded-full text-blue-600 hover:bg-gray-200 transition cursor-pointer"
          >
            {isPending ? (
              "Adding..."
            ) : (
              <Grid2x2Plus />
            )}
            
          </button>
        </div>
      </div>

      <CreateTableModal baseId={baseId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
