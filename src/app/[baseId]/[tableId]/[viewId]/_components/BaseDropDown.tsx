"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Trash2, User } from "lucide-react";

export default function BaseDropdown({base} : {
    base: {
        color: string | null;
        id: number;
        name: string | null;
        ownerId: string;
    } | null;
}) {
    if (!base) return null;

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
                {base?.name}
                <ChevronDown />
            </button>

            {/* menu */}
            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="account-menu text-gray-800 fixed left-4 mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 space-y-1 text-sm"
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-black text-2xl">{base.name}</p>

                        <Trash2 className="w-4 h-4 text-red-600 cursor-pointer"/>
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
                                onClick={() => console.log(`Selected: ${color}`)} // TODO
                            />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
