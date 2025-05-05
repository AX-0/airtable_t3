"use client";

import { useState } from "react";
// import { TableTabs } from "../_components/TableTabs";
import VirtualTable from "./_components/Table/VirtualTableTG";
// import { TableToolbar } from "../_components/TableToolbar";

type Props = {
  baseId: number;
  tableId: number;
  viewId: number;
};

export default function TableView({ baseId, tableId, viewId }: Props) {
  const [selectedTableId, setSelectedTableId] = useState(tableId);

  return (
    <div className="flex flex-col h-screen">
      {/* <TableTabs tables={tables} selectedId={selectedTableId} onSelect={setSelectedTableId} /> */}
      <div className="flex-1 overflow-hidden">
        <VirtualTable baseId={baseId} tableId={selectedTableId} viewId={viewId} />
      </div>
      {/* <TableToolbar tableId={selectedTableId} /> */}
    </div>
  );
}
