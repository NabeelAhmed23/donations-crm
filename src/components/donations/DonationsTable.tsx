"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  type Row,
  Column,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Donation } from "@/types/donation";

interface DonationsTableProps {
  donations: Donation[];
  canManage: boolean;
  onEdit: (donation: Donation) => void;
  onDelete: (donation: Donation) => void;
}

export default function DonationsTable({
  donations,
  canManage,
  onEdit,
  onDelete,
}: DonationsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo<ColumnDef<Donation>[]>(
    () =>
      [
        {
          accessorKey: "name",
          header: ({ column }: { column: Column<Donation> }) => (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="pl-4"
            >
              Name
            </Button>
          ),
          cell: ({ row }: { row: Row<Donation> }) => (
            <span className="font-medium pl-4">{row.original.name}</span>
          ),
        },
        {
          accessorKey: "type",
          header: "Type",
          cell: ({ row }: { row: Row<Donation> }) => (
            <Badge
              variant={
                row.original.type === "COMPULSORY" ? "default" : "secondary"
              }
              className={
                row.original.type === "COMPULSORY" ? "bg-orange-600" : ""
              }
            >
              {row.original.type === "COMPULSORY"
                ? "Compulsory"
                : "Non-Compulsory"}
            </Badge>
          ),
        },
        {
          accessorKey: "manager",
          header: "Manager",
          cell: ({ row }: { row: Row<Donation> }) => (
            <div>
              <div className="font-medium">
                {row.original.manager?.firstName}{" "}
                {row.original.manager?.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.manager?.email}
              </div>
            </div>
          ),
        },
        {
          accessorKey: "dueDate",
          header: "Due Date",
          cell: ({ row }: { row: Row<Donation> }) =>
            row.original.dueDate
              ? new Date(row.original.dueDate).toLocaleDateString()
              : "-",
        },
        {
          accessorKey: "year",
          header: "Year",
          cell: ({ row }: { row: Row<Donation> }) => (
            <Badge variant="outline">{row.original.year}</Badge>
          ),
        },
        // {
        //   id: "stats",
        //   header: "Stats",
        //   cell: ({ row }: { row: Row<Donation> }) => (
        //     <div className="text-sm">
        //       <div>{row.original._count?.payments ?? 0} payments</div>
        //       {row.original.type === "COMPULSORY" && (
        //         <div className="text-muted-foreground">
        //           Remaining: Rs {Math.round(row.original.remainingAmount)}
        //         </div>
        //       )}
        //     </div>
        //   ),
        // },
        canManage
          ? {
              id: "actions",
              header: "Actions",
              cell: ({ row }: { row: Row<Donation> }) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(row.original)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(row.original)}
                  >
                    Delete
                  </Button>
                </div>
              ),
              enableHiding: false,
            }
          : undefined,
      ].filter(Boolean) as ColumnDef<Donation>[],
    [canManage, onEdit, onDelete]
  );

  const table = useReactTable({
    data: donations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (donations.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-muted-foreground text-lg">
          No donations found for the selected filters.
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or create a new donation.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter donations..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
