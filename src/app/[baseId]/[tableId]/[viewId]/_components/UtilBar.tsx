"use client";

import { ChevronDown, Filter, EyeOff, SortAsc, Plus } from "lucide-react";
import FilterPanel from "./UtilPanelFilter";
import HideFieldsPanel from "./UtilPanelHideFields";
import SortPanel from "./UtilPanelSort";
import CellSearch from "./CellSearch"
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

type Props = {
    baseId: number;
    tableId: number;
    viewId: number;
    hiddenColumns: number[];
    columns: { id: number; name: string }[];
    setHiddenColumns: (columnId: number) => void;
    searchTerm: string;
};

export default function UtilBar({ baseId, tableId, viewId, hiddenColumns, columns, setHiddenColumns, searchTerm }: Props) {

    const {data: views = [], isLoading} = api.view.getAllView.useQuery({tableId: Number(tableId)});

    const [showInput, setShowInput] = useState(false);
    const [newViewName, setNewViewName] = useState("");

    const utils = api.useUtils();
    const router = useRouter();

    const createView = api.view.createView.useMutation({
        onSuccess: async (newView) => {
          setShowInput(false);
          setNewViewName("");
          await utils.view.getAllView.invalidate();
          router.push(`/${baseId}/${tableId}/${newView.id}`);
        },
    });

    const createRow = api.row.createRow.useMutation({
        onSuccess: async () => {
          await utils.table.getTableData.invalidate();
        },
    });

    return (
        <div className="flex items-center justify-between h-12 px-4 py-1 border-b bg-black shadow-sm text-sm">
            <div className="flex items-center gap-2">
                <select 
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700" 
                    value={viewId}
                    onChange={(e) => {
                        const selectedViewId = Number(e.target.value);

                        if (viewId != selectedViewId) {
                            router.push(`/${baseId}/${tableId}/${selectedViewId}`);
                        }
                    }}
                >
                    {
                        views.map((view) => (
                            <option key={view.id} value={view.id}>{view.name}</option>
                        ))
                    }
                </select>

                {/* <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700">
                <EyeOff className="w-4 h-4" />
                Hide Fields
                <ChevronDown className="w-4 h-4" />
                </button> */}

                <HideFieldsPanel
                    viewId={viewId}
                    columns={columns}
                    initialHiddenColumns={hiddenColumns}
                    onToggleColumn={setHiddenColumns}
                />

                <FilterPanel tableId={tableId} viewId={viewId}/>

                <SortPanel tableId={tableId} viewId={viewId}/>
            </div>


            <div className="flex items-center gap-2">
                <CellSearch viewId={Number(viewId)} searchTerm={searchTerm}/>

                <button
                    onClick={() => createRow.mutate({ tableId: Number(tableId) })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                    <Plus className="w-4 h-4" />
                    Create Row
                </button>

                {showInput ? (
                    <div className="flex items-center gap-2">

                        <input
                            className="px-2 py-1 rounded border text-sm bg-white"
                            placeholder="View name..."
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newViewName.trim()) {
                                createView.mutate({ name: newViewName, tableId: Number(tableId) });
                                }
                                if (e.key === "Escape") {
                                setShowInput(false);
                                setNewViewName("");
                                }
                            }}
                        />

                        <button
                            onClick={() => {
                                if (newViewName.trim()) {
                                createView.mutate({ name: newViewName, tableId: Number(tableId) });
                                }
                            }
                        }
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
                        >
                        Create
                        </button>

                        <button
                            onClick={() => {
                                setShowInput(false);
                                setNewViewName("");
                            }}
                            className="text-gray-400 text-sm"
                        >
                        Cancel
                        </button>
                    </div>
                    ) : (
                    <button
                        onClick={() => setShowInput(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                        <Plus className="w-4 h-4" />
                        Create View
                    </button>
                )}
            </div>

        </div>
    );
}
