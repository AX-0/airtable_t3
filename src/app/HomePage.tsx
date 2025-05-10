"use client";

import BaseCard from "./_components/BaseCard";
import { useState } from "react";
import Sidebar from "./_components/HomeSideBar";
import HomeNavbar from "./_components/HomeNavbar";
import { SessionProvider } from "next-auth/react";


export default function HomePage({ bases }: { bases: { id: number; name: string | null }[] }) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <SessionProvider>
            <div className="flex flex-col h-screen">
                {/* Navbar always on top */}
                <HomeNavbar setCollapsed={setCollapsed} />

                {/* Main layout: Sidebar + Content */}
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar collapsed={collapsed} />

                    <main className="flex-1 overflow-auto p-6 bg-[#f9fafb]">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">Home</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {bases.map((base) => (
                                <BaseCard key={base.id} base={base} />
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}