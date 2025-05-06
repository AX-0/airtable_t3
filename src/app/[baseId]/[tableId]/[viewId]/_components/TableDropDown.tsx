"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, PencilIcon, Trash2, User } from "lucide-react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

type Props = {
    baseId: number;
    table: {
        name: string | null;
        id: number;
    };
    onlyTable: boolean;
};

export default function TableDropdown({baseId, table, onlyTable} : Props) {
    const router = useRouter();
    const utils = api.useUtils();

    const [open, setOpen] = useState(false);
    const menuRef   = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // close on click-out / Esc
    useEffect(() => {
    function onClick(e: MouseEvent) {
        if (!menuRef.current?.contains(e.target as Node) &&
            !buttonRef.current?.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
        window.removeEventListener("click", onClick);
        window.removeEventListener("keydown", onKey);
    };
    }, []);

    const getFirstTableView = api.base.getFirstTableAndView.useMutation();
    const deleteTable = api.table.deleteTable.useMutation({
        onSuccess: async () => {
        await utils.base.getAllTableIdName.invalidate();
        const res = await getFirstTableView.mutateAsync({ baseId: Number(baseId) });
        router.push(`/${baseId}/${res.tableId}/${res.viewId}`);
        },
    });
    const deleteIsPending = deleteTable.isPending;

    const [showConfirm, setShowConfirm] = useState(false);
    const [targetTableName, setTargetName] = useState("");
    const confirmDelete = async () => {
    await deleteTable.mutateAsync({ tableId: Number(table.id) });
    setShowConfirm(false);
    router.refresh();
    };

    const [showRenamePanel, setShowRenamePanel] = useState(false);
    const [newName, setNewName] = useState(table.name ?? "");
    const renameInputRef = useRef<HTMLInputElement>(null);
    
    const updateTable = api.table.updateTable.useMutation({
        onSuccess: async () => {
            await utils.base.getAllTableIdName.invalidate();
            setShowRenamePanel(false);
            router.refresh();
        },
    });

    const isUpdating = updateTable.isPending;

  return (
    <>

    <div className="relative">
        {/* trigger */}
        <button
            ref={buttonRef}
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium transition cursor-pointer rounded-t-sm h-full bg-white text-gray-800"
        >
            {table.name ?? `Table ${table.id}`}
            <ChevronDown className="w-4 h-4"/>
        </button>

        {/* menu */}
        {open && (
        <div
            ref={menuRef}
            role="menu"
            className="z-50 account-menu text-gray-800 absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 space-y-1 text-sm"
        >
            <button 
                className="flex menu-item items-center gap-2 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowRenamePanel(true);
                    setOpen(false);
                    setTimeout(() => renameInputRef.current?.focus(), 0);
                }}
            >
                <PencilIcon className="w-4 h-4" />
                Rename table
            </button>

            {
                (!onlyTable) ? (
                    <button 
                        className="flex menu-item items-center gap-2 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirm(true);
                            }}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete table
                    </button>
                ) : (
                    ""
                )
            }

        </div>
        )}
    </div>

    {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Delete Table</h3>

            <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <strong>{table.name ?? `Table ID: ${table.id}`}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-sm text-white"
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

    {showRenamePanel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Rename Table</h3>

            <input
                ref={renameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded mb-4 text-black"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) {
                        updateTable.mutate({ id: table.id, name: newName.trim() });
                    } else if (e.key === "Escape") {
                        setShowRenamePanel(false);
                        setNewName(table.name ?? "");
                    }
                }}
            />

            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setShowRenamePanel(false)}
                    className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-sm text-white"
                    disabled={isUpdating}
                >
                    Cancel
                </button>

                <button
                    onClick={() => updateTable.mutate({ id: table.id, name: newName.trim() })}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                    disabled={!newName.trim() && isUpdating}
                >
                    Save
                </button>
            </div>
            </div>
        </div>
    )}

    </>
    
  );
}
