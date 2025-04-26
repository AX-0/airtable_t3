"use client";

import { ChevronDown, Filter, Trash } from "lucide-react";
import { UtilPanel } from "./UtilPanel";
import { api } from "~/trpc/react";
import { useState } from "react";

type Props = {
    tableId: number;
    viewId: number;
};

export default function FilterPanel({ tableId, viewId }: Props) {
    const { data: columns = [], isLoading } = api.column.getAllColNameId.useQuery({ tableId: Number(tableId) });

    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [selectedOperator, setSelectedOperator] = useState<string>("IS_NOT_EMPTY");
    const [filterValue, setFilterValue] = useState("");

    const selectedColumn = columns.find((col) => col.id === selectedColumnId);

    const textOperators = [
    { value: "IS_NOT_EMPTY", label: "is not empty" },
    { value: "IS_EMPTY", label: "is empty" },
    { value: "CONTAINS", label: "contains" },
    { value: "NOT_CONTAINS", label: "not contains" },
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
            where

            {/* Column select */}
            <select
                className="border rounded px-2 py-1"
                value={selectedColumnId ?? ""}
                onChange={(e) => setSelectedColumnId(Number(e.target.value))}
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
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                disabled={!selectedColumnId}
            >
            {getOperatorsForType(selectedColumn?.type).map((op) => (
                <option key={op.value} value={op.value}>
                {op.label}
                </option>
            ))}
            </select>

            {/* Value input */}
            <input
                className="border rounded px-2 py-1 flex-1 w-full"
                placeholder="Enter a value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={!selectedColumnId}
            />

            <button className="text-red-600 cursor-pointer">
                <Trash />
            </button>
        </div>

        <div className="flex justify-between pt-2">
            <button className="text-blue-600 text-sm cursor-pointer">
            + Add condition
            </button>
        </div>
        </div>
    </UtilPanel>
    );
}
