"use client";

import TableTabs from "./TableTabs"
import BaseNavbar from "./BaseNavBar";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

type Props = {
    baseId: number;
    tableId: number;
    viewId: number;
};

export default function BaseHeader({ baseId, tableId, viewId }: Props) {
    const { data: baseQ, isLoading } = api.base.getBase.useQuery(
        { baseId: Number(baseId) },
        { enabled: baseId !== null && baseId !== undefined }
    );
    
    const base = baseQ ?? null;

    const [color, setColor] = useState<string>("blue");

    useEffect(() => {
        if (baseQ?.color) {
            setColor(baseQ.color);
        }
    }, [baseQ?.color]);
    
    if (isLoading || !baseQ) return null;

  return (
    <>
        <BaseNavbar base={base} color={color} setColor={setColor}/>

        <TableTabs baseId={baseId} selectedTableId={tableId} color={color}/>    
    </>
  );
}
