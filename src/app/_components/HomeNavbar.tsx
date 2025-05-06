"use client";

import { Menu as MenuIcon, Search, HelpCircle, Bell, Home, Settings, LogOut, AppWindow, Store, Upload, PlusCircle, Plus, ChevronDown, Star, Notebook, ArrowLeft } from "lucide-react"; // Lucide icons
import Image from "next/image";
import Link from "next/link";

import AccountDropdown from "./AccountDropdown";

import { useSession  } from "next-auth/react"
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

type Props = {
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function HomeNavbar({ setCollapsed }: Props) {
    const [hovered, setHovered] = useState(false);
    const { data: session, status } = useSession();

    const router = useRouter();

    if (!session && status !== "loading") return null;

    return (
        <nav className={`sticky top-0 z-50 flex items-center justify-between w-full h-13 px-4 shadow-sm bg-white`}>
            
            {/* Left */}
            <div className="flex items-center justify-between gap-8">
            <button onClick={() => setCollapsed(prev => !prev)}>
                <MenuIcon className="w-6 h-6 cursor-pointer" />
            </button>
            <Link href="/">
                <Image src="/logo.png" alt="Logo" width={120} height={32} className="cursor-pointer" />
            </Link>
            </div>

            {/* Middle, search //TODO */}
            <div className="flex justify-center w-full px-4 flex-1 max-w-lg mx-8">
                <div className="flex items-center w-[300px] px-4 py-2 bg-white border-2 border-gray-200 rounded-full cursor-pointer">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
            <HelpCircle className="w-5 h-5 text-gray-800" />
            <Bell className="w-5 h-5 text-gray-800" />

            <AccountDropdown />
            </div>
        </nav>
    );
}
