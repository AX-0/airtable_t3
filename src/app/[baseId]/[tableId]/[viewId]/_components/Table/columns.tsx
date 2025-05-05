import type { ColumnDef } from "@tanstack/react-table";

export type DbRow = { id: number; tableId: number };

export function makeColumnDefs(
  cols: { id: number; name: string }[],
): ColumnDef<DbRow>[] {
  return cols.map((c) => ({
    id: String(c.id),
    header: c.name,
    size: 200,
    // read-only cell: just show value
    cell: ({ row }) => (
      <span className="px-3 py-2 truncate block">
        {(row.original as any)[c.id] ?? "" /* later replace with lookup */}
      </span>
    ),
  }));
}
