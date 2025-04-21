"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function CreateBase() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = api.useUtils();
  const router = useRouter();

  const createBase = api.base.createBaseDefault.useMutation({
    onSuccess: async () => {
      await utils.base.getBases.invalidate();
      router.refresh();
      setOpen(false);
      setName("");
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex justify-center items-center rounded-xl bg-blue-500 text-white text-lg font-semibold shadow-sm hover:shadow-md transition p-4 cursor-pointer"
      >
        Create New Base
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Base</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Base name"
              className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => createBase.mutate({ name })}
                disabled={!name || createBase.isPending}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createBase.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
