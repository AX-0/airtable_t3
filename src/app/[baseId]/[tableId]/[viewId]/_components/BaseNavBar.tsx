"use client";

import { Menu as MenuIcon, Search, HelpCircle, Bell, Home, Settings, LogOut, AppWindow, Store, Upload, PlusCircle, Plus, ChevronDown, Star, Notebook, ArrowLeft } from "lucide-react"; // Lucide icons
import Image from "next/image";
import Link from "next/link";

import AccountDropdown from "~/app/_components/AccountDropdown";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import BaseDropdown from "./BaseDropDown";

type Props = {
    baseId: number;
};

export default function BaseNavbar({
    base,
    color,
    setColor,
} : {
    base: {
        color: string | null;
        id: number;
        name: string | null;
        ownerId: string;
    } | null;
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [hovered, setHovered] = useState(false);
    const router = useRouter();
  
    // const { data: baseQ, isLoading } = api.base.getBase.useQuery(
    //     { baseId: Number(baseId) },
    //     { enabled: baseId !== null && baseId !== undefined }
    // );
  
    // const base = baseQ ?? null;

    // const [color, setColor] = useState<string>(base?.color ?? "blue");

    // if (isLoading || !baseQ) return null;
  
    const bgColorClassMap: Record<string, string> = {
      blue: "bg-blue-500",
      red: "bg-red-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      gray: "bg-gray-500",
      pink: "bg-pink-500",
      orange: "bg-orange-500",
    };
  
    const bgClass = bgColorClassMap[color] ?? "bg-white";
    
    // console.log(bgClass);

    return (
        <nav className={`sticky top-0 z-50 flex items-center justify-between w-full h-13 px-4 shadow-sm text-white ${bgClass}`}>
            {/* Left */}
            <div className="flex items-center justify-between gap-4">
                <div
                    className="relative w-6 h-6 flex items-center justify-center rounded-full hover:bg-white cursor-pointer transition-all"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onClick={() => router.push("/")}
                >

                    <div className="absolute transition-opacity duration-200 ease-in-out opacity-100">
                        {!hovered && <Notebook className="w-5 h-5" />}
                    </div>

                    <div title="Go home" className={`absolute transition-opacity duration-200 ease-in-out ${hovered ? "opacity-100" : "opacity-0"}`}>
                        <ArrowLeft className={`w-3 h-3 text-black`} strokeWidth={2.5} />
                    </div>

                </div>

                {/* <button className="flex justify-between items-center font-bold text-xl gap-1 cursor-pointer">
                    {base?.name}
                    <ChevronDown />
                </button> */}

                <BaseDropdown 
                    base={base}
                    onColorChange={(newColor) => setColor(newColor)}
                />

                <div className="flex justify-between items-center gap-3 text-gray-100 text-[0.8125rem]">
                    <button className="rounded-full bg-black/25 text-white px-3 py-1 shadow-inner shadow-black/10">
                        Data
                    </button>

                    <button className="rounded-full px-3 py-1 hover:bg-black/15 transition-all duration-200 cursor-pointer">
                        Automations
                    </button>

                    <button className="rounded-full px-3 py-1 hover:bg-black/15 transition-all duration-200 cursor-pointer">
                        Interfaces
                    </button>

                    <div className="w-px h-5 bg-white/30 mx-2" />

                    <button className="rounded-full px-3 py-1 hover:bg-black/15 transition-all duration-200 cursor-pointer">
                        Forms
                    </button>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5" />
                <Bell className="w-5 h-5" />

                <AccountDropdown />
            </div>
        </nav>
    );
}
