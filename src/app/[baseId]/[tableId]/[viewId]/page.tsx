import TableView from "./TableView";
import BaseHeader from "./_components/BaseHeader";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { views, tables, bases } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";

export default async function ViewPage({
    params,
}: {
    params: Promise<{
        baseId: number;
        tableId: number;
        viewId: number;
    }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { baseId, tableId, viewId } = await params;

    const result = await db
        .select({ view: views })
        .from(views)
        .innerJoin(tables, eq(views.tableId, tables.id))
        .innerJoin(bases, eq(tables.baseId, bases.id))
        .where(
        and(
            eq(views.id, viewId),
            eq(tables.id, tableId),
            eq(bases.id, baseId),
            eq(bases.ownerId, session.user.id),
        )
        )
        .limit(1);

    if (result.length === 0) redirect("/");

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
