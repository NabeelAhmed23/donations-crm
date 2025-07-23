"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { toast } from "sonner";

const userDonationSchema = z.object({
  userId: z.string().min(1, "User is required"),
  targetAmount: z.number().min(0),
});

type UserDonationFormValues = z.infer<typeof userDonationSchema>;

export function CreateUserDonationDialog({
  donationId,
}: {
  donationId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const form = useForm({
    resolver: zodResolver(userDonationSchema),
    defaultValues: {
      userId: "",
      targetAmount: 0,
    },
  });

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    }
    fetchUsers();
  }, []);

  function handleSubmit(data: UserDonationFormValues) {
    try {
      fetch("/api/user-donations", {
        method: "POST",
        body: JSON.stringify({
          donationId,
          ...data,
        }),
      });
      toast.success("User donation added successfully");
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to add user donation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add User Donation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User Donation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField<UserDonationFormValues, "userId">
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName || user.lastName
                            ? `${user.firstName ?? ""} ${
                                user.lastName ?? ""
                              }`.trim()
                            : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<UserDonationFormValues, "targetAmount">
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      onChange={(e) => {
                        field.onChange(Number(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Add
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
