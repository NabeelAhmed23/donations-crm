"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

interface DonationFormValues {
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

const defaultValues: DonationFormValues = {
  name: "",
  description: "",
  type: "COMPULSORY",
  targetAmount: "",
  dueDate: "",
  year: new Date().getFullYear().toString(),
  managerId: "",
};

export default function DonationFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<DonationFormValues>({
    defaultValues,
    mode: "onChange",
  });

  // Fetch managers on open
  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      fetchManagers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const handleSubmit = async (values: DonationFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        targetAmount: parseFloat(values.targetAmount),
        year: parseInt(values.year),
      };
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Donation created successfully");
        setOpen(false);
        form.reset(defaultValues);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create donation");
      }
    } catch {
      toast.error("Error creating donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Donation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Donation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Optional description..."
                    />
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
            {/* <FormField
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
                    {form.getValues("type") === "COMPULSORY" ? "*" : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      disabled={form.getValues("type") === "NON_COMPULSORY"}
                      required={form.getValues("type") === "COMPULSORY"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <FormField
              control={form.control}
              name="dueDate"
              rules={{
                validate: (value) => {
                  if (form.getValues("type") === "COMPULSORY" && !value) {
                    return "Due Date is required for compulsory donations";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Due Date{" "}
                    {form.getValues("type") === "COMPULSORY" ? "*" : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      disabled={form.getValues("type") === "NON_COMPULSORY"}
                      required={form.getValues("type") === "COMPULSORY"}
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
                    <Input {...field} type="number" required />
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset(defaultValues);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
