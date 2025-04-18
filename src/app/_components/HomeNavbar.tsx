"use client";

import { Menu, Search, HelpCircle, Bell } from "lucide-react"; // Lucide icons
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react"

export default function HomeNavbar() {
  return (
    <nav className="flex items-center justify-between w-full h-16 px-4 bg-white shadow">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={120} height={32} className="cursor-pointer" />
        </Link>
      </div>

      {/* Middle, search //TODO */}
      <div className="flex items-center flex-1 max-w-lg mx-8">
        <div className="flex items-center w-full px-4 py-2 bg-gray-100 rounded-full">
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
        {/* <HelpCircle className="w-5 h-5 text-gray-600" />
        <Bell className="w-5 h-5 text-gray-600" /> */}

        {/* <form 
          method="POST"
          action="/api/auth/signout"
          className="px-3 py-2 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold"
        >
          <input type="hidden" name="callbackUrl" value="/" />
          <button type="submit">Sign out</button>
        </form> */}
        <button 
        className="px-3 py-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center font-bold cursor-pointer transition"
        onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
