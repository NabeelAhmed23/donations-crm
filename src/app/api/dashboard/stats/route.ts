import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");

    // Build the base where clause for user donations
    const userDonationWhere: any = {
      userId: session.user.id,
      donation: {
        isActive: true
      }
    };

    // If filtering by specific donation, add donationId filter
    if (donationId) {
      userDonationWhere.donationId = donationId;
    }

    // Get total donations count that are assigned to the current user
    const totalDonations = await prisma.userDonation.count({
      where: userDonationWhere,
    });

    // Get total paid amount for the user's assigned donations only
    const userDonationIds = await prisma.userDonation.findMany({
      where: userDonationWhere,
      select: { donationId: true }
    });

    const donationIds = userDonationIds.map(ud => ud.donationId);

    // If user has no assigned donations, return zeros
    if (donationIds.length === 0) {
      return NextResponse.json({
        totalDonations: 0,
        totalPaid: 0,
        pendingApproval: 0,
        userPayments: 0,
      });
    }

    const userPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        donationId: { in: donationIds },
        status: "APPROVED",
      },
    });

    const totalPaid = userPayments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    // Get pending approval count for the user's assigned donations only
    const pendingApproval = await prisma.payment.count({
      where: {
        userId: session.user.id,
        donationId: { in: donationIds },
        status: "PENDING",
      },
    });
    
    // Get user's total payments count for assigned donations only
    const userPaymentsCount = await prisma.payment.count({
      where: { 
        userId: session.user.id,
        donationId: { in: donationIds }
      },
    });

    return NextResponse.json({
      totalDonations,
      totalPaid,
      pendingApproval,
      userPayments: userPaymentsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
