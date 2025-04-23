"use client";

import { ChevronDown, Filter, EyeOff, SortAsc, Plus } from "lucide-react";
import { UtilPanel } from "./UtilPanel";

export default function FilterPanel() {
    return (
        <UtilPanel
        trigger={
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className="w-4 h-4" />
            </div>
        }
        >
        <div className="text-sm text-gray-700 space-y-2">
            <div className="font-semibold">In this view, show records</div>

            <div className="flex items-center gap-2">
                <select className="border rounded px-2 py-1" >
                    <option>Col</option>
                </select>
                <select className="border rounded px-2 py-1">
                    <option>contains</option>
                </select>
                <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Enter a value"
                />
            </div>

            <div className="flex justify-between pt-2">
                <button className="text-blue-600 text-sm">
                    + Add condition
                </button>
            </div>
        </div>
        </UtilPanel>

    )
}