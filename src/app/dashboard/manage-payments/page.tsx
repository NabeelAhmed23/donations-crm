"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingPaymentsTable } from "@/components/payments/PendingPaymentsTable";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Donation {
  id: string;
  name: string;
  type: string;
  year: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  description?: string;
  status: string;
  notes?: string;
  user: User;
  donation: Donation;
  createdAt: string;
}

export default function ManagePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || !["MANAGER", "VICE_MANAGER", "ADMIN"].includes(session.user.role)) {
      router.push("/dashboard");
      return;
    }

    fetchPendingPayments();
  }, [session, status, router]);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch("/api/payments/pending");

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Access denied. Manager or Admin privileges required.");
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch pending payments");
      }

      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (paymentId: string, action: "approve" | "reject", notes?: string) => {
    setProcessingPaymentId(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} payment`);
      }

      const updatedPayment = await response.json();
      
      // Remove the payment from the list since it's no longer pending
      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
      
      toast.success(`Payment ${action === "approve" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action} payment`);
    } finally {
      setProcessingPaymentId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
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
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <div className="ml-auto flex space-x-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
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

  if (!session?.user || !["MANAGER", "VICE_MANAGER", "ADMIN"].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Payments</h1>
            <p className="text-muted-foreground">
              Review and approve pending payment submissions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
              {payments.length} pending
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingPaymentsTable
            data={payments}
            onApprove={handleApproval}
            isLoading={processingPaymentId !== null}
          />
        </CardContent>
      </Card>
    </div>
  );
}