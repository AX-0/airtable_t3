"use client";

import { useRouter } from "next/navigation";
import { NotepadText } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";

type BaseCardProps = {
  base: {
    id: number;
    name: string | null;
  };
};

export default function BaseCard({ base }: BaseCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const utils = api.useUtils();

  const getFirstTableView = api.base.getFirstTableAndView.useMutation();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await getFirstTableView.mutateAsync({ baseId: base.id });
      router.push(`/${base.id}/${res.tableId}/${res.viewId}`);
    } catch (err) {
      console.error("Failed to fetch first table/view:", err);
    } finally {
      setLoading(false);
    }
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
