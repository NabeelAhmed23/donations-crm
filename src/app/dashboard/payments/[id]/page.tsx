"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, ArrowLeft, CreditCard, User, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  paymentDate: string;
  description?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  donation: {
    id: string;
    name: string;
    type: "COMPULSORY" | "NON_COMPULSORY";
    year: number;
    targetAmount: number;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  useSession();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const paymentId = params.id as string;

  const fetchPayment = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      } else {
        toast.error("Payment not found");
        router.push("/dashboard/payments");
      }
    } catch {
      toast.error("Error fetching payment details");
      router.push("/dashboard/payments");
    } finally {
      setLoading(false);
    }
  }, [paymentId, router]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const generatePDF = async () => {
    if (!payment || !receiptRef.current) return;

    setGenerating(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`payment-receipt-${payment.id}.pdf`);
      toast.success("Receipt downloaded successfully");
    } catch {
      toast.error("Error generating PDF");
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "PENDING":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading payment details...</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Payment not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Payment Details</h1>
        </div>
        <Button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {generating ? "Generating..." : "Download Receipt"}
        </Button>
      </div>

      <div ref={receiptRef} className="bg-white p-8 rounded-lg border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Receipt
          </h2>
          <p className="text-gray-600">Receipt ID: {payment.id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="text-lg font-bold">
                  Rs. {payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment Date:</span>
                <span>
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Created:</span>
                <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
              {payment.approvedAt && (
                <div className="flex justify-between">
                  <span className="font-medium">Processed:</span>
                  <span>
                    {new Date(payment.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>
                  {payment.user.firstName} {payment.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{payment.user.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Donation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{payment.donation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <span>{payment.donation.type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Year:</span>
                <span>{payment.donation.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Target Amount:</span>
                <span>
                  Rs. {payment.donation.targetAmount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {payment.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Approved By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>
                    {payment.approvedBy.firstName} {payment.approvedBy.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{payment.approvedBy.email}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {payment.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{payment.description}</p>
            </CardContent>
          </Card>
        )}

        {payment.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{payment.notes}</p>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        <div className="text-center text-sm text-gray-500">
          <p>
            Generated on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
          <p>This is an official receipt for the payment made.</p>
        </div>
      </div>
    </div>
  );
}
