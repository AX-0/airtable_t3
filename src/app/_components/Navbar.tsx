import { Link } from "lucide-react";

export default function Navbar() {
    return (
      <nav className="w-full bg-gray-800 p-4 text-white">
        <div className="max-w-7xl mx-auto flex justify-between">
          <div className="text-lg font-bold">My App</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/about" className="hover:underline">About</Link>
          </div>
        </div>
      </nav>
    );
  }