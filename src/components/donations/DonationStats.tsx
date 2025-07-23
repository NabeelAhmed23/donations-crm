"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Donation } from "@/types/donation";
import { DollarSign, Target, Clock, TrendingUp } from "lucide-react";

interface DonationStatsProps {
  donations: Donation[];
}

export default function DonationStats({ donations }: DonationStatsProps) {
  // Only include COMPULSORY donations in amount calculations
  const compulsoryDonations = donations.filter((d) => d.type === "COMPULSORY");

  const totalTarget = compulsoryDonations.length
    ? parseInt(
        compulsoryDonations
          .reduce(
            (sum, d) =>
              sum +
              d.userDonations.reduce(
                (sum, ud) => sum + Number(ud.targetAmount),
                0
              ),
            0
          )
          .toString()
      )
    : 0;
  // Only show totalPaid for a single non-compulsory donation, otherwise 0 for non-compulsory
  let totalPaidStat = 0;
  if (donations.length === 1 && donations[0].type === "NON_COMPULSORY") {
    totalPaidStat = donations[0].totalPaid;
  } else if (compulsoryDonations.length) {
    totalPaidStat = parseInt(
      compulsoryDonations.reduce((sum, d) => sum + d.totalPaid, 0).toString()
    );
  }
  const totalRemaining = parseInt((totalTarget - totalPaidStat).toString());
  const overdueDonations = donations.filter(
    (d) => new Date(d.dueDate) < new Date() && d.totalPaid < totalTarget
  ).length;
  const completedDonations = donations.filter(
    (d) => d.totalPaid >= totalTarget
  ).length;
  const progressPercentage =
    totalTarget > 0 ? (totalPaidStat / totalTarget) * 100 : 0;

  // Determine if only a single non-compulsory donation is selected
  const onlyNonCompulsory =
    donations.length === 1 && donations[0].type === "NON_COMPULSORY";

  const stats = [
    onlyNonCompulsory
      ? null
      : {
          title: "Total Target",
          value: `Rs ${totalTarget.toFixed(0)}`,
          icon: Target,
          description: `Across ${compulsoryDonations.length} donations`,
        },
    {
      title: "Total Collected",
      value: `Rs ${totalPaidStat.toFixed(0)}`,
      icon: DollarSign,
      description: donations.every((d) => d.type === "NON_COMPULSORY")
        ? null
        : `${progressPercentage.toFixed(1)}% of target`,
    },
    onlyNonCompulsory
      ? null
      : {
          title: "Remaining",
          value: `Rs ${totalRemaining.toFixed(0)}`,
          icon: TrendingUp,
          description: `${completedDonations} completed`,
        },
    onlyNonCompulsory
      ? null
      : {
          title: "Overdue",
          value: overdueDonations.toString(),
          icon: Clock,
          description: "Donations past due date",
          variant: overdueDonations > 0 ? "destructive" : "default",
        },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.filter(Boolean).map((stat, index) => {
        const s = stat!;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  s.variant === "destructive" && s.value !== "0"
                    ? "text-red-600"
                    : ""
                }`}
              >
                {s.value}
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
