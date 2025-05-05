"use client";

import { useRouter } from "next/navigation";
import { NotepadText, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";

type BaseCardProps = {
  base: {
    id: number;
    name: string | null;
  };
};

export default function BaseCard({ base }: BaseCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = api.useUtils();

  const getFirstTableView = api.base.getFirstTableAndView.useMutation();
  const deleteBase = api.base.deleteBase.useMutation({
    onSuccess: async () => {
      await utils.base.getBases.invalidate(); // refresh base list
    },
  });

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getFirstTableView.mutateAsync({ baseId: base.id });
      router.push(`/${base.id}/${res.tableId}/${res.viewId}`);
    } catch (err) {
      console.error("Failed to fetch first table/view:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    await deleteBase.mutateAsync({ id: base.id });
    setShowConfirm(false);
    router.refresh();
  };

  const deleteIsPending = deleteBase.isPending;

  return (
    <>
      <div
        onClick={handleClick}
        className="flex justify-between items-center rounded-xl bg-white shadow-sm hover:shadow-md transition px-4 py-5 cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-15 h-15 rounded-lg bg-purple-700 flex items-center justify-center text-white">
            <NotepadText />
          </div>

          <h2 className="text-lg font-semibold text-black">{base.name}</h2>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="text-red-600 hover:text-red-800 transition cursor-pointer"
          title="Delete base"
        >
          <Trash2 className="w-5 h-5" />
        </button>

      </div>

      {/* Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Delete Base</h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{base.name ?? "this base"}</strong>? This action cannot be undone.
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
