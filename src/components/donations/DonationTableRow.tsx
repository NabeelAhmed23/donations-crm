"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import DonationProgressBar from "./DonationProgressBar";
import type { Donation } from "@/types/donation";

interface DonationTableRowProps {
  donation: Donation;
  canManage: boolean;
  onEdit: (donation: Donation) => void;
  onDelete: (donation: Donation) => void;
}

export default function DonationTableRow({
  donation,
  canManage,
  onEdit,
  onDelete,
}: DonationTableRowProps) {
  // Safe date parsing
  const dueDateObj = donation.dueDate ? new Date(donation.dueDate) : null;
  const isOverdue = dueDateObj ? dueDateObj < new Date() : false;
  const isCompleted = false; // No target amount defined in schema

  // Safe event handlers
  const handleEdit = () => {
    try {
      onEdit(donation);
    } catch {
      // Optionally log error
    }
  };
  const handleDelete = () => {
    try {
      onDelete(donation);
    } catch {
      // Optionally log error
    }
  };

  return (
    <TableRow className={isOverdue && !isCompleted ? "bg-red-50" : ""}>
      <TableCell>
        <div>
          <div className="font-medium">{donation.name || "-"}</div>
          {donation.description ? (
            <div className="text-sm text-muted-foreground mt-1">
              {donation.description}
            </div>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={donation.type === "COMPULSORY" ? "default" : "secondary"}
          className={donation.type === "COMPULSORY" ? "bg-orange-600" : ""}
        >
          {donation.type === "COMPULSORY" ? "Compulsory" : "Non-Compulsory"}
        </Badge>
      </TableCell>
      <TableCell>
        {"N/A"}
      </TableCell>
      <TableCell className="w-48">
        <DonationProgressBar
          totalPaid={
            typeof donation.totalPaid === "number" ? donation.totalPaid : 0
          }
          targetAmount={1}
        />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">
            {donation.manager?.firstName || "-"}{" "}
            {donation.manager?.lastName || ""}
          </div>
          <div className="text-sm text-muted-foreground">
            {donation.manager?.email || "-"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div
            className={
              isOverdue && !isCompleted ? "text-red-600 font-medium" : ""
            }
          >
            {dueDateObj ? dueDateObj.toLocaleDateString() : "-"}
          </div>
          {isOverdue && !isCompleted && (
            <div className="text-xs text-red-500">Overdue</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{donation.year || "-"}</Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{donation._count?.payments ?? 0} payments</div>
          {donation.type === "COMPULSORY" && (
            <div className="text-muted-foreground">
              Remaining: Rs
              {typeof donation.remainingAmount === "number"
                ? donation.remainingAmount.toFixed(2)
                : "-"}
            </div>
          )}
        </div>
      </TableCell>
      {canManage && (
        <TableCell>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              title="Edit donation"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={donation._count?.payments > 0}
              title={
                donation._count?.payments > 0
                  ? "Cannot delete donation with payments"
                  : "Delete donation"
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
