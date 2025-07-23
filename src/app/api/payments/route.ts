import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPaymentSchema = z.object({
  donationId: z.string().min(1, "Donation is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get("donationId");
    const status = searchParams.get("status");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause: Record<string, string | number> = {};

    // Always return payments for the current logged-in user
    whereClause.userId = session.user.id;

    if (donationId) {
      whereClause.donationId = donationId;
    }
    if (status) {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
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
            type: true,
            year: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Verify the donation exists
    const donation = await prisma.donation.findUnique({
      where: { id: validatedData.donationId },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Check if payment amount is reasonable
    if (
      donation.type === "COMPULSORY" &&
      validatedData.amount > Number(donation.targetAmount)
    ) {
      return NextResponse.json(
        { error: "Payment amount cannot exceed target amount" },
        { status: 400 }
      );
    }

    // Get current total approved payments for this donation by this user
    const userApprovedPayments = await prisma.payment.aggregate({
      where: {
        donationId: validatedData.donationId,
        userId: session.user.id,
        status: "APPROVED",
      },
      _sum: {
        amount: true,
      },
    });

    const currentTotal = Number(userApprovedPayments._sum.amount || 0);
    const targetAmount = Number(donation.targetAmount);

    // For compulsory donations, prevent overpayment
    if (
      donation.type === "COMPULSORY" &&
      currentTotal + validatedData.amount > targetAmount
    ) {
      return NextResponse.json(
        {
          error: `Payment would exceed target amount. You have already paid Rs ${currentTotal} out of Rs ${targetAmount}`,
        },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        donationId: validatedData.donationId,
        userId: session.user.id,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate,
        description: validatedData.description,
        status: "PENDING",
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
            type: true,
            year: true,
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
