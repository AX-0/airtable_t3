"use client";
import { useEffect, useRef, useState } from "react";
import { LogOut, Trash2, User } from "lucide-react";

export default function AccountDropdown() {
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
        className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"
      >
        <User className="w-4 h-4" />
      </button>

      {/* menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 space-y-1 text-sm"
        >
          <div className="px-4 py-3 border-b">
            <p className="font-medium">Alan Xie</p>
            <p className="text-gray-500 text-xs">alanxie123@gmail.com</p>
          </div>

          <button className="menu-item">Account</button>

          <button className="menu-item flex justify-between">
            Manage groups <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">Business</span>
          </button>

          <button className="menu-item">Notification preferences</button>
          <button className="menu-item">Language preferences</button>

          <div className="border-t my-1" />

          <button className="menu-item">Contact sales</button>
          <button className="menu-item">Upgrade</button>
          <button className="menu-item">Tell a friend</button>

          <div className="border-t my-1" />

          <button className="menu-item">Integrations</button>
          <button className="menu-item">Builder hub</button>

          <div className="border-t my-1" />

          <button className="menu-item text-red-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Trash
          </button>

          <button className="menu-item flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}

      {/* <style jsx>{`
        .menu-item {
          @apply w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100;
        }
      `}</style> */}
    </div>
  );
}
