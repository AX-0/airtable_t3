import HomeNavbar from "~/app/_components/HomeNavbar";
import TableView from "./TableView";

export default async function ViewPage(props: {
  params: {
    baseId: string;
    tableId: string;
    viewId: string;
  };
}) {
  const { baseId, tableId, viewId } = await props.params;

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
