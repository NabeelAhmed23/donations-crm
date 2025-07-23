import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    // Build where clause for donations
    const donationWhereClause: {
      isActive: boolean;
      year?: number;
      type?: string;
    } = {
      isActive: true,
    };
    
    if (year) {
      donationWhereClause.year = parseInt(year);
    }
    if (type) {
      donationWhereClause.type = type;
    }

    // Get donations that are assigned to the current user
    const userDonations = await prisma.userDonation.findMany({
      where: {
        userId: session.user.id,
        donation: donationWhereClause,
      },
      include: {
        donation: {
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        donation: {
          createdAt: "desc",
        },
      },
    });

    // Transform the data to match the expected donation format
    const donationsWithStats = await Promise.all(
      userDonations.map(async (userDonation) => {
        const donation = userDonation.donation;
        
        // Get total paid by current user for this donation
        const userPaid = await prisma.payment.aggregate({
          where: {
            donationId: donation.id,
            userId: session.user.id,
            status: "APPROVED",
          },
          _sum: {
            amount: true,
          },
        });

        const totalPaidByUser = Number(userPaid._sum.amount || 0);
        const targetAmount = Number(userDonation.targetAmount || 0);

        return {
          id: donation.id,
          name: donation.name,
          description: donation.description,
          type: donation.type,
          year: donation.year,
          dueDate: donation.dueDate,
          targetAmount: targetAmount,
          totalPaid: totalPaidByUser,
          remainingAmount: Math.max(0, targetAmount - totalPaidByUser),
          paid: userDonation.paid,
          manager: donation.manager,
          userDonation: {
            id: userDonation.id,
            targetAmount: targetAmount,
            paid: userDonation.paid,
          },
        };
      })
    );

    return NextResponse.json(donationsWithStats);
  } catch (error) {
    console.error("Error fetching assigned donations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}