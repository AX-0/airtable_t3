"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

type Props = {
    rowId: number;
    columnId: number;
    value: string;
    tableId: number;
    isFocused: boolean;
    onTab: (direction: "next" | "prev", rowId: number, columnId: number) => void;
    viewId: number;
    searchTerm: string;
    isFiltered: boolean;
    isSorted: boolean;
};

export function EditableCell({
    rowId,
    columnId,
    value,
    tableId,
    isFocused,
    onTab,
    viewId,
    searchTerm,
    isFiltered,
    isSorted,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [input, setInput] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const utils = api.useUtils();

    const { data: colType } = api.column.getType.useQuery({ columnId: Number(columnId) })

    const updateCell = api.cell.update.useMutation({
    onMutate: ({ rowId, columnId, value }) => {
        const prevData = utils.table.getTableData.getInfiniteData({
        tableId,
        viewId: Number(viewId)
        });

        utils.table.getTableData.setInfiniteData({
        tableId,
        viewId: Number(viewId)
        }, (old) => {
        if (!old) return old;
        return {
            ...old,
            pages: old.pages.map((page) => ({
            ...page,
            cells: page.cells.map((cell) =>
                cell.rowId === rowId && cell.columnId === columnId
                ? { ...cell, value }
                : cell
            ),
            })),
        };
        });

        return { prevData };
    },
    onError: (_err, _vars, ctx) => {
        if (ctx?.prevData) {
        utils.table.getTableData.setInfiniteData({
            tableId,
            viewId: Number(viewId)
        }, ctx.prevData);
        }
    },
    onSettled: () => {
        void utils.table.getTableData.invalidate();
        void utils.view.getSearchTerm.invalidate({ viewId });
    },
    });

    useEffect(() => setInput(value), [value]);

    useEffect(() => {
    if (isFocused) {
        setEditing(true);
        inputRef.current?.focus();
    }
    }, [isFocused]);

    const handleSave = () => {
        setEditing(false);
        console.log(input + " : " + value);

        if (input === value) return;

        if (colType === "NUMBER" && isNaN(Number(input))) {
            alert("Invalid input: this column expects a number.");
            setInput(value);
            return;
        }

        setInput(input);
        updateCell.mutate({ rowId, columnId, value: input, tableId: Number(tableId) });
    };

    const content = React.useMemo(() => {
        if (!searchTerm) return input;

        const term = searchTerm.toLowerCase();
        if (!value.toLowerCase().includes(term)) return input;

        return input
            .split(new RegExp(`(${term})`, "i"))
            .map((part, i) =>
                part.toLowerCase() === term ? (
                    <mark className="bg-amber-200/40" key={i}>{part}</mark>
                ) : (
                    part
                ),
            );
    }, [input, searchTerm]);

    const hasMatch = !!searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase());

    let bgClass = "";
    if (isFiltered && hasMatch) {
        bgClass = "bg-[#eff8dd]";
    } else if (isSorted && hasMatch) {
        bgClass = "bg-[#fcebda]"
    } else if (isFiltered) {
        bgClass = "bg-green-100";
    } else if (isSorted) {
        bgClass = "bg-red-100";
    }

    const cellClass =
    "w-[200px] px-3 py-2 text-sm text-gray-800 border-r border-gray-200 " +
    "overflow-hidden whitespace-nowrap text-ellipsis flex items-center " +
    bgClass;

    return (
    <div
        className={cellClass}
        onClick={() => setEditing(true)}
    >
        {editing ? 
            (
                <input
                    ref={inputRef}
                    value={input}
                    autoFocus
                    onChange={(e) => setInput(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Tab") {
                        e.preventDefault();
                        handleSave();
                        onTab(e.shiftKey ? "prev" : "next", rowId, columnId);
                    }
                    }}
                    className="w-full border px-1 rounded text-sm "
                />
            ) : (
                <span className="truncate">{content}</span>
            )
        }
    </div>
    );
}
