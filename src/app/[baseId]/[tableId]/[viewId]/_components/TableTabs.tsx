"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Plus } from "lucide-react";

type TableTabsProps = {
  baseId: number;
  selectedTableId: number;
  viewId: number;
  onAdd?: () => void;
};

export default function TableTabs({
  baseId,
  selectedTableId,
  viewId,
  onAdd,
}: TableTabsProps) {
  const router = useRouter();

  const { data: tables = [], isLoading } = api.base.getAllTableIdName.useQuery({
    baseId: Number(baseId),
  });
  

  const getFirstView = api.view.getFirstView.useMutation({
    onSuccess: ({ viewId, tableId }) => {
      router.push(`/${baseId}/${tableId}/${viewId}`);
    },
  });

  const handleTabClick = (tableId: number) => {
    if (tableId === selectedTableId) return;
    getFirstView.mutate({ tableId });
  };

  return (
    <div className="flex items-center px-4 py-0.5 border-b bg-white shadow-sm">
      {isLoading ? (
        <span className="text-sm text-gray-500">...</span>
      ) : (
        tables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleTabClick(table.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              table.id === selectedTableId
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {table.name ?? `Table ${table.id}`}
          </button>
        ))
      )}

      <button
        onClick={onAdd}
        className="ml-auto px-3 py-1.5 text-sm rounded-full text-blue-600 hover:bg-gray-200 transition cursor-pointer"
      >
        <Plus />
      </button>
    </div>
  );
}
