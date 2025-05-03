"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Grid2x2Plus, Plus, Search, Trash2, X } from "lucide-react";
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

  const getFirstTableView = api.base.getFirstTableAndView.useMutation();
  const deleteTable = api.table.deleteTable.useMutation({
    onSuccess: async () => {
      const res = await getFirstTableView.mutateAsync({ baseId: Number(baseId) });
      router.push(`/${baseId}/${res.tableId}/${res.viewId}`);
    },
  });
  const deleteIsPending = deleteTable.isPending;

  const [showConfirm, setShowConfirm] = useState(false);
  const [targetTableName, setTargetName] = useState("");
  const confirmDelete = async () => {
    await deleteTable.mutateAsync({ tableId: Number(selectedTableId) });
    setShowConfirm(false);
    router.refresh();
  };

  const nameById = useMemo(
    () => new Map(tables.map(t => [t.id, t.name])),
    [tables],
  );
  

  // const isPending = add1kRows.isPending;
  const isPending = add100kRows.isPending;

  // console.log(nameById.get(selectedTableId));

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
          {tables.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="px-3 py-1.5 rounded-full text-red-600 hover:bg-gray-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

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

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Delete Table</h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{nameById.get(Number(selectedTableId)) ?? `Table ID: ${selectedTableId}`}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
              disabled={deleteIsPending}
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
              disabled={deleteIsPending}
            >
              {deleteIsPending ? "Deleting..." : "Delete"}
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
