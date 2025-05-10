"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ChevronDown, Grid2x2Plus, Plus, Search, Trash2, X } from "lucide-react";
import CreateTableModal from "./TableTabsCreateTable";
import TableDropdown from "./TableDropDown";

type TableTabsProps = {
    baseId: number;
    selectedTableId: number;
    // viewId: number;
    color: string;
};

export default function TableTabs({ baseId, selectedTableId, color }: TableTabsProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const utils = api.useUtils();

    const { data: tables = [], isLoading } = api.base.getAllTableIdName.useQuery({
        baseId: Number(baseId),
    });

    const getFirstView = api.view.getFirstView.useMutation({
        onSuccess: ({ viewId, tableId }) => {
        router.push(`/${baseId}/${tableId}/${viewId}`);
        },
    });

    const add1kRows = api.table.add1k.useMutation({
        onSuccess: async () => {
        await utils.table.getTableData.invalidate();
        router.refresh();
        },
    });

    const add100kRows = api.table.add100k.useMutation({
        onSuccess: async () => {
        await utils.table.getTableData.invalidate();
        router.refresh();
        },
    });

    // const isPending = add1kRows.isPending;
    const isPending = add100kRows.isPending;

    // console.log(nameById.get(selectedTableId));

    const bgColorClassMap: Record<string, string> = {
        blue: "bg-blue-700/90",
        red: "bg-red-700/90",
        green: "bg-green-700/90",
        yellow: "bg-yellow-700/90",
        purple: "bg-purple-700/90",
        gray: "bg-gray-700/90",
        pink: "bg-pink-700/90",
        orange: "bg-orange-700/90",
    };

    const bgClass = bgColorClassMap[color] ?? "bg-white";

    return (
        <>
            <div className={`z-40 sticky flex items-center h-7 px-4 py-0.5 ${bgClass} text-gray-100`}>

                <div className="flex">
                    {isLoading ? (
                        <span className="text-sm text-gray-500">...</span>
                    ) : (
                        tables.map((table) => {
                            const isSelected = Number(table.id) === Number(selectedTableId);
                            return (
                                <div key={table.id} className="flex items-center">
                                    {(isSelected) ? (
                                        <TableDropdown baseId={baseId} table={table} onlyTable={tables.length <= 1}/>
                                    ) : (
                                        <button
                                            onClick={() => getFirstView.mutate({ tableId: table.id })}
                                            className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium transition cursor-pointer rounded-t-sm h-full hover:text-white hover:bg-black/10"
                                        >
                                            {table.name ?? `Table ${table.id}`}
                                        </button>
                                    )}                            
                                
                                    {(!isSelected) ? <div className="w-px h-3 bg-white/30" /> : ""}
                                </div>
                            );
                        })
                    )}

                    <button
                        onClick={() => setOpen(true)}
                        className="px-3 py-1.5 text-sm rounded-full transition cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        // onClick={() => add1kRows.mutate({tableId: Number(selectedTableId)})}
                        onClick={() => add100kRows.mutate({tableId: Number(selectedTableId)})}
                        className="px-3 py-1.5 text-sm rounded-full transition cursor-pointer"
                        title="Add 100k Rows"
                    >
                        {isPending ? (
                            "Adding..."
                        ) : (
                            <Grid2x2Plus className="w-4 h-4" />
                        )}
                    
                    </button>
                </div>
            </div>

            <CreateTableModal baseId={baseId} open={open} onClose={() => setOpen(false)} />
        </>
    );
}
