"use client";

import {
  LayoutGrid,
  Check,
  Table2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function ViewSidebarPanel({
    isOpen,
    onClose,
    views = [],
    selectedViewId,
    baseId,
}: {
    isOpen: boolean;
    onClose: () => void;
    views: {
        id: number;
        name: string | null;
        tableId: number;
        filters: unknown;
        sorts: unknown;
        hiddenColumns: unknown;
        searchTerm: string | null;
    }[];
    selectedViewId: number;
    baseId: number
}) {
    if (!isOpen) return null;

    const utils = api.useUtils();
    const router = useRouter();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [targetViewId, setTargetViewId] = useState<number | null>(null);
    const [targetViewName, setTargetViewName] = useState<string>("");
    
    const getFirstView = api.view.getFirstView.useMutation();
    const deleteView = api.view.deleteView.useMutation({
        onSuccess: async () => {
            await utils.view.getAllView.invalidate();

            const fallback = await getFirstView.mutateAsync({ tableId: views[0]?.tableId ?? 0 });
            router.push(`/${baseId}/${fallback.tableId}/${fallback.viewId}`);
        },
    });

    const deleteIsPending = deleteView.isPending;

    const [showModal, setShowModal] = useState(false);
    const [newViewName, setNewViewName] = useState("");

    const createView = api.view.createView.useMutation({
        onSuccess: async (newView) => {
          await utils.view.getAllView.invalidate();
          router.push(`/${baseId}/${views[0]?.tableId}/${newView.id}`);
        },
    });

    console.log(selectedViewId);

    return (
        <>
            <aside
                className={`transition-all duration-300 bg-white border-r border-gray-200 
                ${isOpen ?
                        "w-64" : "w-0"} 
                overflow-hidden`}
            >
                <div className="flex flex-col h-full">

                    {/* Views */}
                    <div className="p-3 border-b">
                        <h2 className="text-sm font-medium text-gray-700 mb-2">Views</h2>

                        {views.map((view) => (
                            <button
                                key={view.id}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer
                                    ${Number(selectedViewId) === Number(view.id)
                                        ? "bg-blue-100 text-blue-800"
                                        : "hover:bg-gray-100"}
                                `}
                            >
                                <div className="flex items-center gap-2 text-left w-full">
                                    <Table2 className="w-4 h-4 text-blue-500" />
                                    <span className="flex-1 truncate">{view.name}</span>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                {views.length > 1 && (
                                    <button
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        setTargetViewId(view.id);
                                        setTargetViewName(view.name ?? `View ${view.id}`);
                                        setShowDeleteModal(true);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                )}
                                    
                                    {Number(selectedViewId) === Number(view.id) && <Check className="w-4 h-4 text-blue-500" />}
                                </div>
                                

                                
                            </button>
                        ))}
                    </div>
                </div>

                {/* Create */}
                <div className="flex-1 p-3 overflow-y-auto">
                    <h3 className="text-sm font-medium">Create...</h3>

                    <div className="mt-2 space-y-1 text-sm text-gray-800">
                        <div 
                            className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => setShowModal(true)}
                        >
                            <button
                                className="flex items-center gap-2"
                            >
                                <Table2 />
                                <span>Grid</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
            
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New View</h2>

                        <input
                            type="text"
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="View name"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />

                        <div className="flex justify-end mt-4 gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                onClick={() => {
                                    setNewViewName("");
                                    setShowModal(false);
                                } }
                            >
                                Cancel
                            </button>

                            <button
                                disabled={!newViewName.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
                                onClick={() => {
                                    createView.mutate({ tableId: views[0]?.tableId ?? 0, name: newViewName });
                                    setShowModal(false);
                                    setNewViewName("");
                                } }
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Delete View</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete <strong>{targetViewName}</strong>?
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                            disabled={deleteIsPending}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={async () => {
                                if (targetViewId !== null) {
                                await deleteView.mutateAsync({ viewId: targetViewId });
                                setShowDeleteModal(false);
                                }
                            }}
                            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
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
