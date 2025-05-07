"use client";

import { ChevronDown, Filter, Trash } from "lucide-react";
import { UtilPanel } from "./UtilPanel";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

type Props = {
    tableId: number;
    viewId: number;
    filters: FilterCondition[];
    setFilters: React.Dispatch<React.SetStateAction<FilterCondition[]>>;
};

type FilterCondition = {
    columnId: number | null;
    operator: string;
    value: string;
};

export default function FilterPanel({ tableId, viewId, filters, setFilters }: Props) {
    const { data: columns = [], isLoading: columnsLoading } = api.column.getAllColNameId.useQuery({ tableId: Number(tableId) });

    const { data: fetchedFilters = [], isLoading: filtersLoading } = api.view.getFilters.useQuery(
        { viewId: Number(viewId) }
    ) as { data: FilterCondition[]; isLoading: boolean };

    const utils = api.useUtils();
  
    // const [filters, setFilters] = useState<FilterCondition[]>([]);
  
    useEffect(() => {
      setFilters(fetchedFilters);
    }, [fetchedFilters]);

    const textOperators = [
        { value: "IS_NOT_EMPTY", label: "is not empty" },
        { value: "IS_EMPTY", label: "is empty" },
        { value: "CONTAINS", label: "contains" },
        // { value: "NOT_CONTAINS", label: "not contains" },
        { value: "EQUALS", label: "equals" },
    ];

    const numberOperators = [
        { value: "GREATER_THAN", label: "greater than" },
        { value: "LESS_THAN", label: "less than" },
    ];

    const getOperatorsForType = (colType: string | undefined) => {
    if (colType === "NUMBER") return numberOperators;
        return textOperators;
    };

    const updateViewFilters = api.view.updateViewFilters.useMutation({
        onSuccess: () => {
            void utils.table.getTableData.invalidate();
        }
    });

    const deleteFilter = api.view.deleteFilter.useMutation({
        onSuccess: () => {
            void utils.table.getTableData.invalidate();
            void utils.view.getFilters.invalidate();
        }
    });

    let bgClass = "bg-white hover:bg-gray-200"
    if (filters.length > 0) {
        bgClass = "bg-green-200 hover:bg-green-300"
    }

    return (
    <UtilPanel
        trigger={
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${bgClass} transition text-gray-700`}>
            <Filter className="w-4 h-4" />
                Filter
            <ChevronDown className="w-4 h-4" />
        </div>
        }
    >
        <div className="w-[500px] text-sm text-gray-700 space-y-4">
            <div className="font-semibold">In this view, show records</div>

            {/* Render each condition */}
            {filters.map((filter, index) => {
                const selectedColumn = columns.find((col) => col.id === filter.columnId);

                return (
                <div key={index} className="flex items-center gap-2">
                    where

                    {/* Column select */}
                    <select
                        className="border rounded px-2 py-1"
                        value={filter.columnId ?? ""}
                        onChange={(e) => {
                            const newFilters = [...filters];
                            if (newFilters[index]) {
                                newFilters[index].columnId = Number(e.target.value);
                            }
                            setFilters(newFilters);
                            
                            if(filter.operator === "IS_EMPTY" || filter.operator === "IS_NOT_EMPTY" ) {
                                filter.value = "";
                                updateViewFilters.mutate({
                                    viewId: Number(viewId),
                                    filters: newFilters.filter(f => f.columnId !== null) as {
                                        columnId: number;
                                        operator: string;
                                        value: string;
                                    }[],
                                });
                            }
                        }}
                    >
                    <option value="" disabled>Select column</option>
                        {columns.map((col) => (
                            <option key={col.id} value={col.id}>
                            {col.name}
                            </option>
                        ))}
                    </select>

                    {/* Operator select */}
                    <select
                        className="border rounded px-2 py-1"
                        value={filter.operator}
                        onChange={(e) => {
                            const newFilters = [...filters];
                            if (newFilters[index]) {
                                newFilters[index].operator = e.target.value;

                                if (e.target.value === "IS_EMPTY" || e.target.value === "IS_NOT_EMPTY") {
                                newFilters[index].value = "";
                                }
                            }
                            setFilters(newFilters);

                            // console.log(newFilters);

                            updateViewFilters.mutate({
                                viewId: Number(viewId),
                                filters: newFilters.filter(f => f.columnId !== null) as {
                                columnId: number;
                                operator: string;
                                value: string;
                                }[],
                            });
                        }}
                          
                        // disabled={!filter.columnId}
                    >
                        {getOperatorsForType(selectedColumn?.type).map((op) => (
                            <option key={op.value} value={op.value}>
                            {op.label}
                            </option>
                        ))}
                    </select>

                    {/* Input */}
                    <input
                        className="border rounded px-2 py-1 flex-1 w-full"
                        placeholder="Enter a value"
                        value={filter.value}
                        onChange={(e) => {
                            const newFilters = [...filters];
                            if (newFilters[index]) {
                            newFilters[index].value = e.target.value;
                            }
                            setFilters(newFilters);

                            // console.log(newFilters);
                            updateViewFilters.mutate({
                                viewId: Number(viewId),
                                filters: newFilters
                                    .filter(f => f.columnId !== null)
                                    .map(f => ({
                                        columnId: Number(f.columnId),
                                        operator: f.operator,
                                        value: f.value,
                                    })),
                            });
                        }}
                        disabled={
                            !filter.columnId ||
                            filter.operator === "IS_EMPTY" || 
                            filter.operator === "IS_NOT_EMPTY"
                        }
                    />

                    {/* Trash button */}
                    <button
                        className="text-red-600 cursor-pointer"
                        onClick={() => {
                            const filterToDelete = filters[index];
                            if (filterToDelete?.columnId == null) return;

                            deleteFilter.mutate({
                                viewId: Number(viewId),
                                filter: {
                                  columnId: Number(filterToDelete.columnId),
                                  operator: filterToDelete.operator,
                                  value: filterToDelete.value,
                                },
                            });

                            setFilters((prev) => prev.filter((_, i) => i !== index));
                        }}
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                </div>
                );
            })}

            {/* Add condition button */}
            <div className="flex justify-between pt-2">
                <button
                    className="text-blue-600 text-sm cursor-pointer"
                    onClick={() =>
                        setFilters((prev) => [
                        ...prev,
                        { columnId: null, operator: "IS_NOT_EMPTY", value: "" },
                        ])
                    }
                >
                    + Add condition
                </button>
            </div>
        </div>
    </UtilPanel>
    );
}
