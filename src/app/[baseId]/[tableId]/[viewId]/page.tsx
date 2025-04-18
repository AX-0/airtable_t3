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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Table View</h1>
      <p>Base ID: {baseIdNum}</p>
      <p>Table ID: {tableIdNum}</p>
      <p>View ID: {viewIdNum}</p>
    </div>
  );
}
