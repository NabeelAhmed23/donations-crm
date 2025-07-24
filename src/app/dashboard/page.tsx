"use client";

import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface DashboardStats {
  totalDonations: number;
  totalPaid: number;
  pendingApproval: number;
  userPayments: number;
}

interface Donation {
  id: string;
  name: string;
  year?: number;
  targetAmount: number;
  remainingAmount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    totalPaid: 0,
    pendingApproval: 0,
    userPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<string>("all");
  const { data: session } = useSession();

  // Fetch assigned donations
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await fetch("/api/donations/assigned");
        if (response.ok) {
          const data = await response.json();
          setDonations(data);
        }
      } catch (error) {
        console.error("Failed to fetch donations:", error);
      }
    };

    fetchDonations();
  }, []);

  // Fetch stats (with optional donation filter)
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const url =
          selectedDonation === "all"
            ? "/api/dashboard/stats"
            : `/api/dashboard/stats?donationId=${selectedDonation}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedDonation]);

  const statCards = [
    {
      title: "Total Donations",
      value: stats.totalDonations,
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Amount Paid",
      value: `Rs ${stats.totalPaid.toFixed(2)}`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Approval",
      value: stats.pendingApproval,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "My Payments",
      value: stats.userPayments,
      icon: User,
      color: "text-purple-600",
    },
  ];

  const quickActions = [
    {
      title: "Make Payment",
      description: "Log a new payment",
      href: "/dashboard/payments",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Payment History",
      description: "View your payment records",
      href: "/dashboard/payments",
      icon: Clock,
      color: "text-purple-600",
    },
  ];

  if (
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "VICE_MANAGER" ||
    session?.user?.role === "ADMIN"
  ) {
    quickActions.push({
      title: "View Donations",
      description: "Browse available donations",
      href: "/dashboard/donations",
      icon: DollarSign,
      color: "text-blue-600",
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the donations dashboard. Here&apos;s an overview of your
            activities.
          </p>
        </div>
        <div className="min-w-[250px]">
          <Select value={selectedDonation} onValueChange={setSelectedDonation}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by donation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donations</SelectItem>
              {donations.map((donation) => (
                <SelectItem key={donation.id} value={donation.id}>
                  {donation.name} - {donation.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-20" /> : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Button
                    variant="ghost"
                    className="h-auto p-4 flex items-start space-x-4 w-full justify-start"
                  >
                    <IconComponent
                      className={`h-8 w-8 ${action.color} flex-shrink-0`}
                    />
                    <div className="space-y-1 text-left">
                      <p className="font-medium leading-none">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <RecentActivity selectedDonation={selectedDonation} />
    </div>
  );
}
