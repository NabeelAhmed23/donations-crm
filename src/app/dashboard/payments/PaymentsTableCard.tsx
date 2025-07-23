"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";
import * as React from "react";
import { Payment } from "./page";

interface PaymentsTableCardProps {
  payments: Payment[];
  canApprove: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  onApprove: (
    payment: Payment,
    action: "approve" | "reject",
    notes?: string
  ) => void;
}

export default function PaymentsTableCard({
  payments,
  canApprove,
  onEdit,
  onDelete,
  onApprove,
}: PaymentsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentsDataTable
          data={payments}
          canApprove={!!canApprove}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
        />
      </CardContent>
    </Card>
  );
}
