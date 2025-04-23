"use client";

import { ChevronDown, Filter, EyeOff, SortAsc, Plus } from "lucide-react";
import FilterPanel from "./UtilPanelFilter";
import HideFieldsPanel from "./UtilPanelHideFields";
import { columns } from "~/server/db/schema";

export default function UtilBar() {
  return (
    <div className="flex items-center justify-between px-4 py-1 border-b bg-black shadow-sm text-sm">
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
            <EyeOff className="w-4 h-4" />
            Hide Fields
            <ChevronDown className="w-4 h-4" />
            </button>


            {/* <HideFieldsPanel
                columns={columns}
                hiddenColumns={hiddenColumns}
                onToggleColumn={(id) => {
                    setHiddenColumns((prev) =>
                    prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
                    );
                }}
            /> */}


            <FilterPanel />

            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
            <SortAsc className="w-4 h-4" />
            Sort
            <ChevronDown className="w-4 h-4" />
            </button>
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition">
            <Plus className="w-4 h-4" />
            Create View
        </button>
    </div>
  );
}
