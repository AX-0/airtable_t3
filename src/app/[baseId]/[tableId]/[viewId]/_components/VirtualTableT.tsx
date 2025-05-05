"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { EditableCell } from "./EditableCell";
import EditableColumnHeader from "./EditableColumnHeader";
import UtilBar from "./UtilBar";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    type RowData,
    useReactTable,
  } from "@tanstack/react-table";
import {
    useVirtualizer,
    type VirtualItem,
    Virtualizer,
} from '@tanstack/react-virtual'

interface Props {
    baseId: number;
    tableId: number;
    viewId: number;
  }

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void
    }
}

interface Cell {
    cellId: number;
    cellName: string;
    rowId: number;
    columnId: number;
}

const editableCell: Partial<ColumnDef<Cell>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue()
      // We need to keep and update the state of the cell normally
      const [value, setValue] = useState(initialValue)
  
      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        table.options.meta?.updateData(index, id, value)
      }
  
      // If the initialValue is changed external, sync it up with our state
      useEffect(() => {
        setValue(initialValue)
      }, [initialValue])
  
      return (
        <input
          value={value as string}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
        />
      )
    },
  }
  
export function VirtualTable({ baseId, tableId, viewId }: Props) {


}