"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Donation } from "@/types/donation";
import PaymentFormDialog from "./PaymentFormDialog";
import PaymentFilters from "./PaymentFilters";
import PaymentsTableCard from "./PaymentsTableCard";
import { toast } from "sonner";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Payment {
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

interface PaymentFormData {
  donationId: string;
  amount: string;
  paymentDate: string;
  description: string;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [formData, setFormData] = useState<PaymentFormData>({
    donationId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const canApprove =
    session?.user?.role &&
    ["ADMIN", "MANAGER", "VICE_MANAGER"].includes(session.user.role);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(`/api/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        // toast.error("Failed to fetch payments"); // Removed toast
      }
    } catch {
      // toast.error("Error fetching payments"); // Removed toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.donationId || !formData.amount || !formData.paymentDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        donationId: formData.donationId,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        description: formData.description || undefined,
      };

      const url = editingPayment
        ? `/api/payments/${editingPayment.id}`
        : "/api/payments";
      const method = editingPayment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          // Removed toast
          editingPayment
            ? "Payment updated successfully"
            : "Payment logged successfully"
        );
        setIsDialogOpen(false);
        resetForm();
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save payment");
      }
    } catch {
      toast.error("Error saving payment");
    }
  };

  const handleEdit = (payment: Payment) => {
    if (payment.status !== "PENDING") {
      toast.error("Cannot edit payment that has been processed");
      return;
    }

    setEditingPayment(payment);
    setFormData({
      donationId: payment.donation.id,
      amount: payment.amount.toString(),
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      description: payment.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (payment: Payment) => {
    if (payment.status !== "PENDING") {
      // toast.error("Cannot delete payment that has been processed"); // Removed toast
      return;
    }

    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Payment deleted successfully"); // Removed toast
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete payment"); // Removed toast
      }
    } catch {
      toast.error("Error deleting payment"); // Removed toast
    }
  };

  const handleApproval = async (
    payment: Payment,
    action: "approve" | "reject",
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        // toast.success(`Payment ${action}d successfully`); // Removed toast
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} payment`); // Removed toast
      }
    } catch {
      toast.error(`Error ${action}ing payment`); // Removed toast
    }
  };

  const resetForm = () => {
    setFormData({
      donationId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setEditingPayment(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="flex space-x-4">
          <Skeleton className="h-10 w-40" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-4 border rounded"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <div className="ml-auto flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <PaymentFormDialog
          open={isDialogOpen}
          setOpen={setIsDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => setIsDialogOpen(false)}
          loading={loading}
        />
      </div>

      <div className="flex space-x-4">
        <PaymentFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
      </div>

      <PaymentsTableCard
        payments={payments}
        canApprove={!!canApprove}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApproval}
      />
    </div>
  );
}
