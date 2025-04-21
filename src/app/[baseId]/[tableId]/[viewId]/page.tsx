import TableView from "./TableView";
import TableTabs from "./_components/TableTabs"

import { api } from "~/trpc/react";

export default async function ViewPage({
  params,
}: {
  params: Promise<{
    baseId: number;
    tableId: number;
    viewId: number;
  }>;
}) {
  const { baseId, tableId, viewId } = await params;

  return (
    <>
    <TableTabs baseId={baseId} selectedTableId={tableId} viewId={viewId}/>
    
    {/* minus navbar height */}
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col"> 
      <TableView
        baseId={baseId}
        tableId={tableId}
        viewId={viewId} />
    </div>
    
    </>
  );
}
