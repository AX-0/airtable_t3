"use client";

import { ChevronDown, Filter, EyeOff, SortAsc, Plus, Menu, Table2 } from "lucide-react";
import FilterPanel from "./UtilPanelFilter";
import HideFieldsPanel from "./UtilPanelHideFields";
import SortPanel from "./UtilPanelSort";
import CellSearch from "./CellSearch"
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import ViewSidebarPanel from "./ViewSideBar";

type Props = {
    baseId: number;
    tableId: number;
    viewId: number;
    hiddenColumns: number[];
    columns: { id: number; name: string }[];
    setHiddenColumns: (columnId: number) => void;
    searchTerm: string;
    toggleSidebar: () => void;
    filters: FilterCondition[];
    setFilters: React.Dispatch<React.SetStateAction<FilterCondition[]>>;
};

type FilterCondition = {
    columnId: number | null;
    operator: string;
    value: string;
};

export default function UtilBar({ baseId, tableId, viewId, hiddenColumns, columns, setHiddenColumns, searchTerm, toggleSidebar, filters, setFilters }: Props) {
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

    const {data: viewName} = api.view.getName.useQuery({viewId: Number(viewId)});

    // const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex items-center justify-between h-10 px-4 py-1 border-b border-gray-200 bg-white shadow-sm text-sm">
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white hover:bg-gray-200 transition text-gray-700"
                    onClick={toggleSidebar}>
                    <Menu className="w-5 h-5" />
                    Views
                </button>

                <div className="w-px h-4 bg-gray-400" />

                <div 
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-200 text-gray-700"
                    title="Current View"
                >
                    <Table2 className="w-4 h-4 text-blue-500" />
                    <span className="flex-1 truncate">{viewName}</span>
                </div>

                <HideFieldsPanel
                    viewId={viewId}
                    columns={columns}
                    initialHiddenColumns={hiddenColumns}
                    onToggleColumn={setHiddenColumns}
                />

                <FilterPanel tableId={tableId} viewId={viewId} filters={filters} setFilters={setFilters}/>

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
            </div>

        </div>
    );
}
