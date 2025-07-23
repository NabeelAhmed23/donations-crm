"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, Gift, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "payment" | "donation" | "approval";
  title: string;
  description: string;
  amount?: number;
  status?: string;
  createdAt: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  donation?: {
    name: string;
  };
}

interface RecentActivityProps {
  selectedDonation?: string;
}

export function RecentActivity({ selectedDonation = "all" }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const url = selectedDonation === "all" 
          ? "/api/dashboard/recent-activity" 
          : `/api/dashboard/recent-activity?donationId=${selectedDonation}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Failed to fetch recent activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [selectedDonation]);

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "donation":
        return <Gift className="h-4 w-4 text-green-600" />;
      case "approval":
        if (status === "APPROVED") {
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (status === "REJECTED") {
          return <XCircle className="h-4 w-4 text-red-600" />;
        }
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
      PENDING: { variant: "secondary" as const, label: "Pending" },
      APPROVED: { variant: "default" as const, label: "Approved" },
      REJECTED: { variant: "destructive" as const, label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUserInitials = (user?: ActivityItem["user"]) => {
    if (!user) return "?";

    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ""}${
        user.lastName?.[0] || ""
      }`.toUpperCase();
    }

    return user.email[0].toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <svg
                className="h-full w-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No recent activity</h3>
            <p className="text-muted-foreground">
              Your recent donations and payments will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.createdAt + activity.id}
              className="flex items-start space-x-4"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">
                  {getUserInitials(activity.user)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getActivityIcon(activity.type, activity.status)}
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>

                <p className="text-sm text-muted-foreground mb-1">
                  {activity.description}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </p>

                  {activity.amount && (
                    <span className="text-sm font-medium text-green-600">
                      Rs {activity.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length >= 15 && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing latest 15 activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
