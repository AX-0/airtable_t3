import HomeNavbar from "~/app/_components/HomeNavbar";
import TableView from "./TableView";

export default async function ViewPage({
  params,
}: {
  params: Promise<{
    baseId: string;
    tableId: string;
    viewId: string;
  }>;
}) {
  const { baseId, tableId, viewId } = await params;

  const baseIdNum = Number(baseId);
  const tableIdNum = Number(tableId);
  const viewIdNum = Number(viewId);

  return (
    <><HomeNavbar />
    
    <div className="h-screen w-full flex flex-col">
      <TableView
        baseId={Number(baseId)}
        tableId={Number(tableId)}
        viewId={Number(viewId)} />
    </div></>
  );
}
