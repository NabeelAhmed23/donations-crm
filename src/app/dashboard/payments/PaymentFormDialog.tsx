"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { Donation } from "@/types/donation";
import * as React from "react";

interface PaymentFormData {
  donationId: string;
  amount: string;
  paymentDate: string;
  description: string;
}

interface PaymentFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: PaymentFormData;
  setFormData: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingPayment?: boolean;
  loading?: boolean;
}

export default function PaymentFormDialog({
  open,
  setOpen,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingPayment = false,
  loading,
}: PaymentFormDialogProps) {
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const fetchDonations = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `/api/donations/assigned?year=${currentYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setDonations(data);
      }
    } catch (error) {
      console.error("Error fetching assigned donations:", error);
    }
  };

  React.useEffect(() => {
    fetchDonations();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={onCancel}>
          <Plus className="h-4 w-4 mr-2" />
          Log Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPayment ? "Edit Payment" : "Log New Payment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="donationId">Donation *</Label>
            <Select
              value={formData.donationId}
              onValueChange={(value) =>
                setFormData({ ...formData, donationId: value })
              }
              disabled={!!editingPayment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a donation" />
              </SelectTrigger>
              <SelectContent>
                {donations.map((donation) => (
                  <SelectItem
                    key={donation.id}
                    value={donation.id}
                    disabled={donation.paid}
                  >
                    {donation.name} - {donation.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (Rs) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Optional payment description..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {editingPayment ? "Update" : "Log Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
