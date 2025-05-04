"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

type Props = {
  baseId: number;
  open: boolean;
  onClose: () => void;
};

export default function CreateTableModal({ baseId, open, onClose }: Props) {
  const [name, setName] = useState("New Table");

  const router = useRouter();

  const utils = api.useUtils();
  const createTable = api.table.createTableAndView.useMutation({
    onSuccess: async () => {
      // console.log(name);
      await utils.base.getAllTableIdName.invalidate();
      onClose();
    },
  });

  const isPending = createTable.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Create Table</h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Table name"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={
              () => createTable.mutate({ baseId: Number(baseId), name })
            }
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
            disabled={isPending}
          >
            {/* Creating */}
            {isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
