"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ManageDonationDataTable } from "@/components/manage-donations/ManageDonationDataTable";
import { CreateUserDonationDialog } from "@/components/manage-donations/CreateUserDonationDialog";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

interface UserDonation {
  id: string;
  userId: string;
  targetAmount: number;
  paid: boolean;
  paidAmount: number;
  remainingBalance: number;
  user: User;
}

interface Donation {
  id: string;
  name: string;
  description?: string;
  type: string;
  year?: number;
  dueDate?: string;
  userDonations: UserDonation[];
}

// Simple Tabs implementation
function Tabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="mb-4 flex gap-2 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function ManageDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchDonations() {
      setLoading(true);
      const res = await fetch("/api/donations");
      if (res.ok) {
        const data = await res.json();
        // For each donation, fetch user donations with payment data
        const donationsWithUserData = await Promise.all(
          data.map(async (donation: Donation) => {
            const userDonationsRes = await fetch(
              `/api/user-donations/${donation.id}`
            );
            if (userDonationsRes.ok) {
              const userDonations = await userDonationsRes.json();
              return { ...donation, userDonations };
            }
            return donation;
          })
        );
        setDonations(donationsWithUserData);
        if (donationsWithUserData.length > 0)
          setActiveTab(donationsWithUserData[0].id);
      }
      setLoading(false);
    }
    fetchDonations();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!donations.length) {
    return <div className="p-8">No donations found.</div>;
  }

  const tabs = donations.map((donation) => ({
    id: donation.id,
    label: donation.name,
  }));

  const activeDonation =
    donations.find((d) => d.id === activeTab) ?? donations[0];

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Donations</h1>
          <p className="text-muted-foreground">
            Manage user donations for each donation
          </p>
        </div>
        <CreateUserDonationDialog donationId={activeDonation.id} />
      </div>
      <Tabs
        tabs={tabs}
        activeTab={activeDonation.id}
        onTabChange={setActiveTab}
      />
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">{activeDonation.name}</h2>
        <p className="mb-4 text-muted-foreground">
          {activeDonation.description}
        </p>
        <ManageDonationDataTable
          data={activeDonation.userDonations.map((item) => ({
            ...item,
            type: activeDonation.type as "COMPULSORY" | "NON_COMPULSORY",
          }))}
        />
      </Card>
    </div>
  );
}
