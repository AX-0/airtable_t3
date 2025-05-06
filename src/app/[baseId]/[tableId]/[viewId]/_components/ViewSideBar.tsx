"use client";

import {
  LayoutGrid,
  Check,
  Table2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function ViewSidebarPanel({
    isOpen,
    onClose,
    views = [],
    selectedViewId,
    baseId,
}: {
    isOpen: boolean;
    onClose: () => void;
    views: {
        id: number;
        name: string | null;
        tableId: number;
        filters: unknown;
        sorts: unknown;
        hiddenColumns: unknown;
        searchTerm: string | null;
    }[];
    selectedViewId: number;
    baseId: number
}) {
    if (!isOpen) return null;

    const utils = api.useUtils();
    const router = useRouter();

    const createView = api.view.createView.useMutation({
        onSuccess: async (newView) => {
          await utils.view.getAllView.invalidate();
          router.push(`/${baseId}/${views[0]?.tableId}/${newView.id}`);
        },
    });

    return (
    <aside 
        className={
            `transition-all duration-300 bg-white border-r border-gray-200 
            ${isOpen ? 
                "w-64" : "w-0"
            } 
            overflow-hidden`
        }
    >
        <div className="flex flex-col h-full">

        {/* Search & Views */}
        <div className="p-3 border-b">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Views</h2>

            {views.map((view) => (
                <button
                    key={view.id}
                    className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer
                        ${selectedViewId === view.id
                            ? "bg-blue-100 text-blue-800"
                            : "hover:bg-gray-100"}
                    `}
                >
                <div className="flex items-center gap-2 text-left w-full">
                    <LayoutGrid className="w-4 h-4 text-blue-500" />
                    <span className="flex-1 truncate">{view.name}</span>
                </div>
                {selectedViewId === view.id && <Check className="w-4 h-4 text-blue-500" />}
                </button>
            ))}
            </div>
        </div>

        {/* Create Section */}
        <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-sm font-medium">Create...</h3>

            <div className="mt-2 space-y-1 text-sm text-gray-800">
                <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                    <button 
                        className="flex items-center gap-2"
                    >
                        <Table2 />
                        <span>Grid</span>
                    </button>
                </div>
            </div>
        </div>
    </aside>
    );
}
