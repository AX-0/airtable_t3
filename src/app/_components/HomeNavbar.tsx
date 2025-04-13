import { Menu, Search, HelpCircle, Bell } from "lucide-react"; // Lucide icons
import Image from "next/image";

export default function HomeNavbar() {
  return (
    <nav className="flex items-center justify-between w-full h-16 px-4 bg-white shadow">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Menu className="w-6 h-6 text-gray-600" /> {/* //TODO */}
        <Image src="/logo.png" alt="Logo" width={120} height={32} />
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
          <span className="text-xs text-gray-400">Ctrl K</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <HelpCircle className="w-5 h-5 text-gray-600" />
        <Bell className="w-5 h-5 text-gray-600" />

        {/* //TODO */}
        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>
    </nav>
  );
}
