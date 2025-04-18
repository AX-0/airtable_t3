"use client";

import { useRouter } from "next/navigation";
import { NotepadText } from "lucide-react";

type BaseCardProps = {
  base: {
    id: number;
    name: string | null;
  };
};

export default function BaseCard({ base }: BaseCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // Replace with dynamic first table/view if available
    router.push(`/${base.id}/1/1`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex justify-between items-center rounded-xl bg-white shadow-sm hover:shadow-md transition p-4 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-lg bg-purple-700 flex items-center justify-center text-white">
        <NotepadText />
      </div>
      <div className="flex-1 ml-4">
        <h2 className="text-lg font-semibold text-black">{base.name}</h2>
      </div>
    </div>
  );
}
