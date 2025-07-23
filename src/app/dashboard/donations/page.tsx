"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DonationFilters from "@/components/donations/DonationFilters";
import DonationsTable from "@/components/donations/DonationsTable";
import DonationStats from "@/components/donations/DonationStats";
import { useDonations } from "@/hooks/useDonations";
import type { Donation } from "@/types/donation";
import DonationFormDialog from "./DonationFormDialog";
import EditDonationDialog from "@/components/donations/EditDonationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DonationsPage() {
  const { data: session } = useSession();
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [selectedDonationId, setSelectedDonationId] = useState<string>("");

  const { donations, loading, deleteDonation, refetchDonations } = useDonations(
    filterYear,
    filterType
  );

  const canManage =
    session?.user?.role &&
    ["ADMIN", "MANAGER", "VICE_MANAGER"].includes(session.user.role);

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    refetchDonations();
    setEditingDonation(null);
  };

  const handleDelete = async (donation: Donation) => {
    await deleteDonation(donation);
  };

  // Find the selected donation if any
  const selectedDonation = selectedDonationId
    ? donations.find((d) => d.id === selectedDonationId)
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-72" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Table Card Skeleton */}
        <Card className="w-full">
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
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-4 w-40" />
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
        <h1 className="text-3xl font-bold">Donation Management</h1>
        <DonationFormDialog />
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={selectedDonationId || "all"}
          onValueChange={(value) =>
            setSelectedDonationId(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a donation to view stats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Donations</SelectItem>
            {donations.map((donation) => (
              <SelectItem key={donation.id} value={donation.id}>
                {donation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DonationStats
        donations={selectedDonation ? [selectedDonation] : donations}
      />

      <DonationFilters
        filterYear={filterYear}
        filterType={filterType}
        onYearChange={setFilterYear}
        onTypeChange={setFilterType}
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Donations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DonationsTable
            donations={donations}
            canManage={!!canManage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <EditDonationDialog
        donation={editingDonation}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingDonation(null);
          }
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
