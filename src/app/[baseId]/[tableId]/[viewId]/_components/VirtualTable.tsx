"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { api } from "~/trpc/react";
import { EditableCell } from "./EditableCell";
import EditableColumnHeader from "./EditableColumnHeader";
import UtilBar from "./UtilBar";
import ViewSidebarPanel from "./ViewSideBar";

interface Props {
    baseId: number;
    tableId: number;
    viewId: number;
}

type FilterCondition = {
    columnId: number | null;
    operator: string;
    value: string;
};

type SortCondition = {
    columnId: number | null;
    direction: "asc" | "desc";
};

export function VirtualTable({ baseId, tableId, viewId }: Props) {
    const parentRef = useRef<HTMLDivElement>(null);

    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

    const { data: hiddenColsdata, isPending } = api.view.getHiddens.useQuery({ viewId: Number(viewId) });
    // useEffect(() => {
    //   setHiddenColumns((hiddenColsdata ?? []) as number[]);
    // }, [hiddenColsdata]);  

    const initialHiddenColumns = (hiddenColsdata ?? []) as number[];

    const [hiddenColumns, setHiddenColumns] = useState<number[]>(initialHiddenColumns);

    const toggleHiddenColumn = (columnId: number) => {
        setHiddenColumns((prev) =>
            prev.includes(columnId)
            ? prev.filter((id) => id !== columnId)
            : [...prev, columnId]
        );
    };


    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = api.table.getTableData.useInfiniteQuery(
        { tableId: Number(tableId), limit: 1000, viewId: Number(viewId) },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
            refetchOnWindowFocus: false,
        }
    );

    const rows = data?.pages.flatMap((page) => page.rows) ?? [];
    const columns = data?.pages[0]?.columns ?? [];
    const cells = data?.pages.flatMap((page) => page.cells) ?? [];

    const cellMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const cell of cells) {
            map.set(`${cell.rowId}_${cell.columnId}`, cell.value);
        }
        return map;
    }, [cells]);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 5,
        getItemKey: index => rows[index]!.id, 
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const [lastItem] = virtualItems.slice(-1);
        if (!lastItem) return;
        if (lastItem.index >= rows.length * 0.7 && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage]);

    const {
        data: searchTermData,
        isFetching: searchFetching,
    } = api.view.getSearchTerm.useQuery(
        { viewId: Number(viewId) },
        { enabled: !!data }
    );

    const visibleCols = useMemo(
        () => columns.filter(c => !hiddenColumns.includes(c.id)),
        [columns, hiddenColumns],
    )

    const handleTab = useCallback(
        (direction: 'next' | 'prev', rowId: number, colId: number) => {
            const rowIndex = rows.findIndex((r) => r.id === rowId);
            const colIndex = visibleCols.findIndex((c) => c.id === colId);

            let nextRow = rowIndex;
            let nextCol = direction === "next" ? colIndex + 1 : colIndex - 1;

            if (nextCol >= visibleCols.length) {
                nextCol = 0;
                nextRow += 1;
            } else if (nextCol < 0) {
                nextRow -= 1;
                nextCol = visibleCols.length - 1;
            }

            if (nextRow < 0 || nextRow >= rows.length) return;

            const nextRowObj = rows[nextRow];
            const nextColObj = visibleCols[nextCol];

            if (!nextRowObj || !nextColObj) return;
            
            setFocusedCell({
                row: Number(nextRowObj.id),
                col: Number(nextColObj.id),
            });
        },
        [columns, rows],
    );

    const searchTerm = searchTermData ?? "";

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const {data: views = []} = api.view.getAllView.useQuery({tableId: Number(tableId)});

    const [filters, setFilters] = useState<FilterCondition[]>([]);
    const [sorts, setSorts] = useState<SortCondition[]>([]);

    if (isLoading) return <div className="p-4 text-gray-600">Loading table...</div>;


    return (
        // minus nav bar height
        <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden">
            <UtilBar
                baseId={baseId}
                tableId={tableId}
                viewId={viewId}
                hiddenColumns={hiddenColumns}
                columns={columns}
                setHiddenColumns={toggleHiddenColumn}
                searchTerm={searchTerm}
                toggleSidebar={toggleSidebar} 
                filters={filters} 
                setFilters={setFilters}  
                sorts={sorts}
                setSorts={setSorts}      
            />



            <div className="flex h-full">

                {/* Sidebar */}
                {sidebarOpen && (
                    <div className="w-64 h-full bg-white border-r z-40">
                        <ViewSidebarPanel
                            isOpen={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                            views={views}
                            selectedViewId={viewId}
                            baseId={baseId}
                            tableId={tableId}
                        />
                    </div>
                )}

                <div ref={parentRef} className="flex-1 overflow-auto relative">
                    <div
                        style={{
                            height: rowVirtualizer.getTotalSize(),
                            position: 'relative',
                        }}
                    >
                        {/* Header Row */}
                        <div className="sticky top-0 z-10 flex bg-gray-100 border-b border-gray-300 text-sm text-gray-700 font-medium">
                            <div className="w-[100px] px-3 py-2 border-r bg-white text-center">#</div>
                            
                            {columns
                                .filter(col => !hiddenColumns.includes(col.id))
                                .map((col) => {

                                    const isFiltered = filters.some(f => f.columnId === col.id);
                                    const isSorted = sorts.some(f => f.columnId === col.id);

                                    return (
                                        <EditableColumnHeader
                                            key={col.id}
                                            columnId={col.id}
                                            name={col.name}
                                            tableId={tableId}
                                            viewId={viewId}
                                            isFiltered={isFiltered}
                                            isSorted={isSorted}
                                        />
                                    )
                                })
                            }

                            <EditableColumnHeader tableId={tableId} viewId={viewId} isAddColumn isFiltered={false} isSorted={false} />

                        </div>

                        {/* Data Rows */}
                        {virtualItems.map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            if (!row) return null;

                            return (
                                <div
                                    key={row.id}
                                    className="flex absolute left-0 w-full border-t border-gray-200"
                                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                                >

                                <div className="w-[100px] px-3 py-2 border-r bg-gray-50">
                                    {virtualRow.index + 1}
                                </div>

                                {visibleCols
                                    .filter(col => !hiddenColumns.includes(col.id))
                                    .map((col) => {
                                    const cellKey = `${row.id}_${col.id}`;
                                    const value = cellMap.get(cellKey) ?? "";

                                    const isFiltered = filters.some(f => f.columnId === col.id);
                                    const isSorted = sorts.some(f => f.columnId === col.id);

                                    return (
                                        <EditableCell
                                            key={`${row.id}_${col.id}`} 
                                            rowId={row.id}
                                            columnId={col.id}
                                            value={value}
                                            tableId={tableId}
                                            isFocused={focusedCell?.row === row.id && focusedCell?.col === col.id}
                                            viewId={viewId}
                                            searchTerm={searchTerm}
                                            onTab={handleTab}
                                            isFiltered={isFiltered}
                                            isSorted={isSorted}
                                        />
                                    );
                                })}

                                <div className="w-[200px] px-3 py-2 border-r" />

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}