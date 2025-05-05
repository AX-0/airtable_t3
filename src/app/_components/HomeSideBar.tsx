"use client";

import { Menu as MenuIcon, Search, HelpCircle, Bell, Home, Settings, LogOut, AppWindow, Store, Upload, PlusCircle, Plus, ChevronDown, Star } from "lucide-react"; // Lucide icons
import Link from "next/link";
import { CreateBase } from "./CreateBase";

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
    return (
      <aside
        className={`h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 flex flex-col justify-between ${
          collapsed ? "w-14" : "w-64"
        }`}
      >
        {/* Top section */}
        <div className={`p-4 ${collapsed ? "justify-center" : "justify-between"}`}>
            {/* <div className={`px-4 py-4 text-sm font-semibold flex items-center`}>
                {!collapsed && <span>Home</span>}
                {!collapsed && <ChevronDown className="w-4 h-4" />}
            </div> */}
  
            {/* <div className="px-4 py-2 text-gray-600 text-sm flex items-center gap-2">
            <Star className="w-4 h-4" />
            {!collapsed && <span>Your starred bases, interfaces, and workspaces will appear here</span>}
            </div> */}
  
            <div className={`py-3 text-sm font-semibold hover:bg-gray-100 cursor-pointer flex ${collapsed ? "justify-center" : "justify-between"}`}>
                <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                    <AppWindow className="w-4 h-4" />
                    {!collapsed && <span>All workspaces</span>}
                </div>
                {!collapsed && <Plus className="w-4 h-4" />}
            </div>

          <div className=" border-t-2 border-gray-200" />
        </div>
  
        {/* Bottom section */}
        <div className="p-4 text-sm space-y-5 text-gray-800 ">
            <div className="border-t-2 border-gray-200" />
            <SidebarLink icon={<AppWindow className="w-4 h-4" />} label="Templates and apps" collapsed={collapsed} />
            <SidebarLink icon={<Store className="w-4 h-4" />} label="Marketplace" collapsed={collapsed} />
            <SidebarLink icon={<Upload className="w-4 h-4" />} label="Import" collapsed={collapsed} />

            <CreateBase collapsed={collapsed}/>
        </div>
      </aside>
    );
  }
  
  function SidebarLink({
    icon,
    label,
    collapsed,
  }: {
    icon: React.ReactNode;
    label: string;
    collapsed: boolean;
  }) {
    return (
      <Link
        href="#"
        className={`flex items-center ${
          collapsed ? "justify-center" : "gap-3"
        } hover:underline`}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  }
  