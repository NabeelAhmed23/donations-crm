import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { donationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { donationId } = params;

    // Get user donations for this donation with payment data
    const userDonations = await prisma.userDonation.findMany({
      where: {
        donationId: donationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        donation: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            year: true,
            dueDate: true,
          },
        },
      },
    });

    // For each user donation, calculate the paid amount and remaining balance
    const userDonationsWithBalance = await Promise.all(
      userDonations.map(async (userDonation) => {
        // Get total paid amount for this user and donation
        const totalPaid = await prisma.payment.aggregate({
          where: {
            donationId: userDonation.donationId,
            userId: userDonation.userId,
            status: "APPROVED",
          },
          _sum: {
            amount: true,
          },
        });

        const paidAmount = Number(totalPaid._sum.amount || 0);
        const targetAmount = Number(userDonation.targetAmount || 0);
        const remainingBalance = Math.max(0, targetAmount - paidAmount);

        return {
          ...userDonation,
          paidAmount,
          remainingBalance,
          targetAmount,
        };
      })
    );

    return NextResponse.json(userDonationsWithBalance);
  } catch (error) {
    console.error("Error fetching user donations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}