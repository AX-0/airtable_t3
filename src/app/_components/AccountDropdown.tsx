"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Trash2, User } from "lucide-react";
import { signOut, useSession  } from "next-auth/react"

export default function AccountDropdown() {
    const [open, setOpen] = useState(false);
    const menuRef   = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { data: session, status } = useSession();

    let userName = "Guest";
    let userEmail = "guest@guest.com";

    if (session?.user) {
        userName = session.user.name ?? "Unnamed";
        userEmail = session.user.email ?? "No Email";
    }
    // const userName = session?.user.name;
    // const userEmail = session?.user.email;

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
            className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center cursor-pointer"
            title="Account"
        >
            {(!userName) ? <User className="w-4 h-4" /> : userName[0]}
        </button>

        {/* menu */}
        {open && (
            <div
                ref={menuRef}
                role="menu"
                className="account-menu text-gray-800 absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 p-2 space-y-1 text-sm"
            >
            <div className="px-4 py-3">
                <p className="text-black font-medium">{userName}</p>
                <p className="text-black text-xs">{userEmail}</p>
            </div>

            <div className="border-t my-1 mx-4 border-gray-200" />

            <button className="flex menu-item items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Account
            </button>

            <div className="border-t my-1 mx-4 border-gray-200" />

            <button 
                className="menu-item flex items-center gap-2 cursor-pointer"
                onClick={() => {
                    document.cookie = "guest=; path=/; max-age=0";
                    void signOut({ callbackUrl: "/login" })
                }}
            >
                <LogOut className="w-4 h-4" /> Log out
            </button>
            </div>
        )}
        </div>
    );
}
