import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface ActivityItem {
  id: string;
  type: 'payment' | 'donation' | 'approval';
  title: string;
  description: string;
  amount?: number;
  status?: string;
  createdAt: Date;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  donation?: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activities: ActivityItem[] = [];

    // Build donation filter for queries
    const donationFilter = donationId ? { donationId } : {};

    // Get recent payments (last 30 days) - only current user's payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...donationFilter,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        donation: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Add payments to activities
    recentPayments.forEach((payment) => {
      activities.push({
        id: payment.id,
        type: 'payment',
        title: 'Payment Submitted',
        description: `Payment for ${payment.donation.name}`,
        amount: Number(payment.amount),
        status: payment.status,
        createdAt: payment.createdAt,
        user: payment.user,
        donation: payment.donation,
      });
    });

    // Get recent donations created by current user (for managers/admins)
    if (['ADMIN', 'MANAGER', 'VICE_MANAGER'].includes(currentUser.role)) {
      const donationWhere: {
        managerId: string;
        createdAt: { gte: Date };
        id?: string;
      } = {
        managerId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      };
      
      // If filtering by specific donation, add id filter
      if (donationId) {
        donationWhere.id = donationId;
      }

      const recentDonations = await prisma.donation.findMany({
        where: donationWhere,
        include: {
          manager: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      recentDonations.forEach((donation) => {
        activities.push({
          id: donation.id,
          type: 'donation',
          title: 'Donation Created',
          description: `Created donation: ${donation.name}`,
          createdAt: donation.createdAt,
          user: donation.manager,
        });
      });
    }

    // Get recent payment approvals for current user's payments
    const recentApprovals = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...donationFilter,
        approvedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['APPROVED', 'REJECTED'],
        },
      },
      include: {
        donation: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: 5,
    });

    recentApprovals.forEach((payment) => {
      const approverName = payment.approvedBy?.firstName || payment.approvedBy?.lastName
        ? `${payment.approvedBy.firstName || ''} ${payment.approvedBy.lastName || ''}`.trim()
        : payment.approvedBy?.email || 'System';

      activities.push({
        id: payment.id,
        type: 'approval',
        title: `Payment ${payment.status.toLowerCase()}`,
        description: `Payment for ${payment.donation.name} ${payment.status.toLowerCase()} by ${approverName}`,
        amount: Number(payment.amount),
        status: payment.status,
        createdAt: payment.approvedAt!,
        user: payment.approvedBy,
        donation: payment.donation,
      });
    });

    // Sort all activities by date and take the most recent 15
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}