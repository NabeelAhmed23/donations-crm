"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Donation } from "@/types/donation";

interface EditDonationFormValues {
  name: string;
  description: string;
  type: "COMPULSORY" | "NON_COMPULSORY";
  targetAmount: string;
  dueDate: string;
  year: string;
  managerId: string;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EditDonationDialogProps {
  donation: Donation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditDonationDialog({
  donation,
  open,
  onOpenChange,
  onSuccess,
}: EditDonationDialogProps) {
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EditDonationFormValues>();

  // Fetch managers on open
  React.useEffect(() => {
    if (open && donation) {
      fetchManagers();
      // Populate form with donation data
      form.reset({
        name: donation.name,
        description: donation.description || "",
        type: donation.type as "COMPULSORY" | "NON_COMPULSORY",
        targetAmount: donation.targetAmount?.toString() || "",
        dueDate: donation.dueDate ? new Date(donation.dueDate).toISOString().split('T')[0] : "",
        year: donation.year.toString(),
        managerId: donation.manager?.id || "",
      });
    }
  }, [open, donation, form]);

  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/managers");
      if (res.ok) {
        const data = await res.json();
        setManagers(data);
      } else {
        setManagers([]);
      }
    } catch {
      setManagers([]);
    }
  };

  const handleSubmit = async (values: EditDonationFormValues) => {
    if (!donation) return;

    setLoading(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        type: values.type,
        targetAmount: values.targetAmount ? parseFloat(values.targetAmount) : undefined,
        dueDate: values.dueDate || undefined,
        year: parseInt(values.year),
        managerId: values.managerId,
      };

      const res = await fetch(`/api/donations/${donation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Donation updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update donation");
      }
    } catch {
      toast.error("Error updating donation");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!donation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Donation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPULSORY">Compulsory</SelectItem>
                          <SelectItem value="NON_COMPULSORY">
                            Non-Compulsory
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Optional description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                rules={{
                  validate: (value) => {
                    if (form.getValues("type") === "COMPULSORY" && !value) {
                      return "Target Amount is required for compulsory donations";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Target Amount (Rs){" "}
                      {form.watch("type") === "COMPULSORY" ? "*" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        disabled={form.watch("type") === "NON_COMPULSORY"}
                        required={form.watch("type") === "COMPULSORY"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="2020"
                        max="2030"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                rules={{
                  validate: (value) => {
                    if (form.watch("type") === "COMPULSORY" && !value) {
                      return "Due Date is required for compulsory donations";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due Date{" "}
                      {form.watch("type") === "COMPULSORY" ? "*" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        disabled={form.watch("type") === "NON_COMPULSORY"}
                        required={form.watch("type") === "COMPULSORY"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.firstName} {manager.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Donation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}