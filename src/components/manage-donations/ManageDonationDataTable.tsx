"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { EditUserDonationDialog } from "@/components/manage-donations/EditUserDonationDialog";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface UserDonation {
  id: string;
  userId: string;
  targetAmount: number;
  paid: boolean;
  paidAmount: number;
  remainingBalance: number;
  type: "COMPULSORY" | "NON_COMPULSORY";
  user: User;
}

interface ManageDonationDataTableProps {
  data: UserDonation[];
}

export function ManageDonationDataTable({
  data = [],
}: ManageDonationDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingDonation, setEditingDonation] =
    React.useState<UserDonation | null>(null);

  const handleEdit = (userDonation: UserDonation) => {
    setEditingDonation(userDonation);
    setEditDialogOpen(true);
  };

  const columns: ColumnDef<UserDonation>[] = [
    {
      header: "Name",
      accessorFn: (row) =>
        row.user.firstName || row.user.lastName
          ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim()
          : row.user.email,
      cell: (info) => info.getValue(),
      id: "name",
    },
    {
      header: "Email",
      accessorFn: (row) => row.user.email,
      cell: (info) => info.getValue(),
      id: "email",
    },
    {
      header: "Target Amount",
      accessorKey: "targetAmount",
      cell: (info) => {
        if (info.row.original.type === "NON_COMPULSORY") {
          return "-";
        }
        return info.getValue() ?? 0;
      },
      id: "targetAmount",
    },
    {
      header: "Progress",
      id: "progress",
      cell: ({ row }) => {
        const target = Number(row.original.targetAmount) || 0;
        const paid = Number(row.original.paidAmount) || 0;
        let progress = 0;
        if (target > 0) {
          progress = Math.min(100, Math.round((paid / target) * 100));
        } else if (row.original.paid) {
          progress = 100;
        }
        if (row.original.type === "NON_COMPULSORY") {
          return "-";
        }
        return (
          <div className="flex flex-col min-w-[120px]">
            <div className="flex justify-between text-xs mb-1">
              <span>Rs {paid.toLocaleString()}</span>
              <span className="text-muted-foreground">
                / Rs {target.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-right mt-1 text-muted-foreground">
              {progress}%
            </div>
          </div>
        );
      },
    },
    {
      header: "Remaining Balance",
      id: "remainingBalance",
      cell: ({ row }) => {
        const remaining = Number(row.original.remainingBalance) || 0;
        if (row.original.type === "NON_COMPULSORY") {
          return "-";
        }
        return (
          <span
            className={remaining > 0 ? "text-orange-600" : "text-green-600"}
          >
            Rs {remaining.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: "Paid",
      accessorKey: "paid",
      cell: ({ row }) => {
        if (row.original.type === "NON_COMPULSORY") {
          return "-";
        }
        return row.original.paid ? (
          <Badge variant="default">Paid</Badge>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        );
      },
      id: "paid",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="outline" onClick={() => handleEdit(row.original)}>
          Edit
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });
  console.log(data);

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter users..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("name")?.setFilterValue(event.target.value);
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="pl-6">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {(table?.getRowModel()?.rows ?? [])?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="pl-6">
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
      {editingDonation && (
        <EditUserDonationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userDonation={editingDonation}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingDonation(null);
            // Optionally trigger a data refresh here
          }}
        />
      )}
    </div>
  );
}
