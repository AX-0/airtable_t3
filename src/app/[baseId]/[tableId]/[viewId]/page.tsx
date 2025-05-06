import TableView from "./TableView";
import TableTabs from "./_components/TableTabs"
import UtilBar from "./_components/UtilBar"

import { api } from "~/trpc/react";
import BaseNavbar from "./_components/BaseNavBar";

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
    <BaseNavbar baseId={baseId} />
    
    <TableTabs baseId={baseId} selectedTableId={tableId} viewId={viewId}/>

    {/* <UtilBar
      baseId={baseId}
      tableId={tableId}
      viewId={viewId}
      hiddenColumns={hiddenColumns}
      columns={columns}
      setHiddenColumns={toggleHiddenColumn}
    /> */}
    
    {/* minus navbar height */}
    <div className="h-[calc(100vh-6.5rem)] w-full flex flex-col">
      <TableView
        baseId={baseId}
        tableId={tableId}
        viewId={viewId} />
    </div>
    
    </>
  );
}
