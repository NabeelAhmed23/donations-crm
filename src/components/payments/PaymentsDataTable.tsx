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
  type Row,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from "next/link";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  user: User;
  donation: Donation;
  approvedBy?: User;
  approvedAt?: string;
  createdAt: string;
}

interface PaymentsDataTableProps {
  data: Payment[];
  canApprove: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  onApprove: (
    payment: Payment,
    action: "approve" | "reject",
    notes?: string
  ) => void;
}

export function PaymentsDataTable({
  data,
  canApprove,
  onEdit,
  onDelete,
  onApprove,
}: PaymentsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const { data: session } = useSession();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-600">
            Approved
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => {
        if (session?.user.role !== "USER") {
          return null;
        }
        return (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => {
        if (session?.user.role !== "USER") {
          return null;
        }
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "donation",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0"
          >
            Donation
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const donation = row.original.donation;
        return (
          <div>
            <div className="font-medium">{donation.name}</div>
            <div className="text-sm text-muted-foreground">
              {donation.year} •{" "}
              {donation.type === "COMPULSORY" ? "Compulsory" : "Non-Compulsory"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0"
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return <div className="font-medium">Rs {amount}</div>;
      },
    },
    {
      accessorKey: "paymentDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0"
          >
            Payment Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.getValue("paymentDate")).toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return getStatusBadge(row.getValue("status"));
      },
    },
    ...(canApprove
      ? [
          {
            accessorKey: "user",
            header: "User",
            cell: ({ row }: { row: Row<Payment> }) => {
              const user = row.original.user;
              return (
                <div>
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              );
            },
          } as ColumnDef<Payment>,
        ]
      : []),
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="max-w-[200px]">
            {payment.description && (
              <div className="text-sm truncate">{payment.description}</div>
            )}
            {payment.notes && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                Note: {payment.notes}
              </div>
            )}
            {payment.approvedBy && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {payment.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
                {payment.approvedBy.firstName} {payment.approvedBy.lastName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;
        const isOwner = payment.user.id === "current-user-id"; // You'll need to pass current user ID
        const isPending = payment.status === "PENDING";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link
                  href={`/dashboard/payments/${payment.id}`}
                  className="flex items-center gap-2"
                >
                  {" "}
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {isPending && isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(payment)}>
                    Edit payment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(payment)}
                    className="text-red-600"
                  >
                    Delete payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {isPending && canApprove && !isOwner && (
                <>
                  <DropdownMenuItem
                    onClick={() => onApprove(payment, "approve")}
                    className="text-green-600"
                  >
                    Approve payment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const notes = prompt("Rejection reason (optional):");
                      onApprove(payment, "reject", notes || undefined);
                    }}
                    className="text-red-600"
                  >
                    Reject payment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter donations..."
          value={
            (table.getColumn("donation")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) => {
            table.getColumn("donation")?.setFilterValue(event.target.value);
            console.log(table.getColumn("donation")?.getFilterValue());
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
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      // className={idx !== 0 ? "px-4" : ""}
                    >
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
