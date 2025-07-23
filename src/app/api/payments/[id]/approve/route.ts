import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentNotification } from "@/lib/notifications";

const approvalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers, vice managers, and admins can approve/reject payments
    if (!["MANAGER", "VICE_MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes } = approvalSchema.parse(body);

    // Check if payment exists and is pending
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        amount: true,
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
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (existingPayment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment is not pending approval" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: session.user.id,
        approvedAt: new Date(),
        notes: notes || null,
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // After approving a payment, check if the user's payments have reached their personalized targetAmount
    if (
      newStatus === "APPROVED" &&
      updatedPayment.donation.type === "COMPULSORY"
    ) {
      // Get the user's UserDonation record for this donation
      const userDonation = await prisma.userDonation.findUnique({
        where: {
          userId_donationId: {
            userId: updatedPayment.user.id,
            donationId: updatedPayment.donation.id,
          },
        },
        select: { targetAmount: true, paid: true },
      });

      if (
        userDonation &&
        userDonation.targetAmount !== null &&
        userDonation.paid === false
      ) {
        // Sum all approved payments for this user and donation
        const totalPaid = await prisma.payment.aggregate({
          where: {
            donationId: updatedPayment.donation.id,
            userId: updatedPayment.user.id,
            status: "APPROVED",
          },
          _sum: { amount: true },
        });

        const totalPaidAmount = Number(totalPaid._sum.amount || 0);
        const targetAmount = Number(userDonation.targetAmount);

        if (totalPaidAmount >= targetAmount) {
          await prisma.userDonation.update({
            where: {
              userId_donationId: {
                userId: updatedPayment.user.id,
                donationId: updatedPayment.donation.id,
              },
            },
            data: { paid: true },
          });
        }
      }
    }

    // Create notification for the payment owner
    try {
      const approverName =
        session.user.name ||
        `${session.user.firstName || ""} ${
          session.user.lastName || ""
        }`.trim() ||
        "Admin";

      await createPaymentNotification(
        existingPayment.userId,
        id,
        newStatus,
        Number(existingPayment.amount),
        existingPayment.donation.name,
        approverName,
        notes
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(updatedPayment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.message },
        { status: 400 }
      );
    }

    console.error("Failed to update payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
