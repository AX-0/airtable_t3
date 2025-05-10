import TableView from "./TableView";
import BaseHeader from "./_components/BaseHeader";

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

            <BaseHeader baseId={baseId} tableId={tableId} viewId={viewId} />
            {/* <BaseNavbar baseId={baseId} />
            
            <TableTabs baseId={baseId} selectedTableId={tableId} viewId={viewId}/> */}

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
