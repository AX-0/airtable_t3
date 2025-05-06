"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Trash2, User } from "lucide-react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function BaseDropdown({
    base,
    onColorChange,
} : {
    base: {
        color: string | null;
        id: number;
        name: string | null;
        ownerId: string;
    } | null;
    onColorChange: (color: string) => void;
}) {
    if (!base) return null;

    const utils = api.useUtils();
    const router = useRouter();

    const [name, setName] = useState<string | null>(base?.name ?? null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const updateColor = api.base.updateColor.useMutation({
        onSuccess: async () => {
            await utils.base.getBase.invalidate();
            router.refresh();
          },
    });

    const updateName = api.base.updateBase.useMutation({
        onSuccess: async () => {
            await utils.base.getBase.invalidate();
            router.refresh();
          },
    });

    const deleteBase = api.base.deleteBase.useMutation({
        onSuccess: async () => {
            await utils.base.getBases.invalidate(); // refresh base list
            router.push("/");
        },
    });
    const deleteIsPending = deleteBase.isPending;

    return (
        <div className="relative">
            {/* trigger */}
            <button 
                ref={buttonRef}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex justify-between items-center font-bold text-xl gap-1 cursor-pointer"
            >
                {name}
                <ChevronDown />
            </button>

            {/* menu */}
            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="account-menu text-gray-800 fixed left-4 mt-2 w-80 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 p-2 space-y-1 text-sm"
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        <input
                            type="text"
                            defaultValue={name ?? ""}
                            onBlur={(e) => {
                            const newName = e.target.value.trim();
                            if (newName && newName !== name) {
                                setName(newName);
                                updateName.mutate({ id: base.id, name: newName });
                            }
                            }}
                            className="p-2 rounded-sm text-black text-2xl font-medium outline-none border-1 border-transparent focus:border-blue-500 hover:bg-black/5 transition-colors w-full mr-2"
                        />
                        <Trash2 
                            className="w-4 h-4 text-red-600 cursor-pointer"
                            onClick={() => setShowDeleteConfirm(true)}
                        />
                    </div>

                    <div className="border-t my-1 mx-4 border-gray-200" />

                    <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-lg font-bold">Appearance</p>

                        <div className="grid grid-cols-4 gap-2">
                            {[
                            "blue", "red", "green", "yellow",
                            "purple", "gray", "pink", "orange"
                            ].map((color) => (
                            <button
                                key={color}
                                className={`w-6 h-6 rounded-md ${`bg-${color}-500`} hover:ring-2 hover:ring-offset-2 hover:ring-${color}-700`}
                                onClick={() => {
                                    onColorChange(color);
                                    updateColor.mutate({ id: Number(base.id), color });
                                }}
                            />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-gray-800">

                    <h2 className="text-lg font-semibold mb-2">Are you sure you want to delete <span className="font-bold">{base.name}</span>?</h2>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteIsPending}
                        >
                        Cancel
                        </button>

                        <button
                            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            onClick={() => deleteBase.mutate({ id: base.id })}
                            disabled={deleteIsPending}
                        >
                        {deleteIsPending ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}
