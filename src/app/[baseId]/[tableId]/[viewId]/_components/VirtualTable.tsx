"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    overscan: 10,
  });

  useEffect(() => {
    const [lastItem] = rowVirtualizer.getVirtualItems().slice(-1);
    if (!lastItem) return;
    if (lastItem.index >= rows.length - 300 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage]);

  const {
    data: searchTermData,
    isFetching: searchFetching,
  } = api.view.getSearchTerm.useQuery(
    { viewId: Number(viewId) },
    { enabled: !!data }
  );
  
  const searchTerm = searchTermData ?? "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const {data: views = []} = api.view.getAllView.useQuery({tableId: Number(tableId)});
  
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
        />



        <div ref={parentRef} className="relative overflow-auto h-full w-full">

                {sidebarOpen && (
                <div className="absolute top-0 left-0 z-40 h-full w-64 bg-white shadow-md border-r border-gray-200 transition-all duration-300">
                <ViewSidebarPanel
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    views={views}
                    selectedViewId={viewId}
                    baseId={baseId}
                />
                </div>
            )}

            <div
                className={
                    `transition-all duration-300 
                    ${
                        sidebarOpen ? "ml-64" : "ml-0"
                    }`
                }
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {/* Header Row */}
                <div className="sticky top-0 z-10 flex bg-gray-100 border-b border-gray-300 text-sm text-gray-700 font-medium">
                    <div className="w-[100px] px-3 py-2 border-r bg-white text-center">#</div>
                    
                    {columns
                    .filter(col => !hiddenColumns.includes(col.id))
                    .map((col) => (
                        <EditableColumnHeader
                        key={col.id}
                        columnId={col.id}
                        name={col.name}
                        tableId={tableId}
                        viewId={viewId}
                        />
                    ))}

                    <EditableColumnHeader tableId={tableId} viewId={viewId} isAddColumn />

                </div>

                {/* Data Rows */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
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

                    {columns
                        .filter(col => !hiddenColumns.includes(col.id))
                        .map((col) => {
                        const cellKey = `${row.id}_${col.id}`;
                        const value = cellMap.get(cellKey) ?? "";

                        return (
                        <EditableCell
                            key={col.id}
                            rowId={row.id}
                            columnId={col.id}
                            value={value}
                            tableId={tableId}
                            isFocused={focusedCell?.row === row.id && focusedCell?.col === col.id}
                            viewId={viewId}
                            searchTerm={searchTerm}
                            onTab={(direction) => {
                            const rowIndex = rows.findIndex((r) => r.id === row.id);
                            const colIndex = columns.findIndex((c) => c.id === col.id);

                            let nextRow = rowIndex;
                            let nextCol = direction === "next" ? colIndex + 1 : colIndex - 1;

                            if (nextCol >= columns.length) {
                                nextCol = 0;
                                nextRow += 1;
                            } else if (nextCol < 0) {
                                nextRow -= 1;
                                nextCol = columns.length - 1;
                            }

                            if (nextRow < 0 || nextRow >= rows.length) return;
                            const nextRowObj = rows[nextRow];
                            const nextColObj = columns[nextCol];
                            if (!nextRowObj || !nextColObj) return;
                            
                            setFocusedCell({
                                row: Number(nextRowObj.id),
                                col: Number(nextColObj.id),
                            });
                            
                            }}
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
  );
}