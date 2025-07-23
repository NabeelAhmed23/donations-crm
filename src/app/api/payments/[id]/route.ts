import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  paymentDate: z.string().transform((str) => new Date(str)).optional(),
  description: z.string().optional(),
});

const approvePaymentSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause: { id: string; userId?: string } = { id };

    // Regular users can only see their own payments
    if (user.role === "USER") {
      whereClause.userId = session.user.id;
    }

    const payment = await prisma.payment.findUnique({
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
            targetAmount: true,
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

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        donation: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Check if this is an approval/rejection action
    if (body.action) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !["ADMIN", "MANAGER", "VICE_MANAGER"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { action, notes } = approvePaymentSchema.parse(body);

      if (payment.status !== "PENDING") {
        return NextResponse.json(
          { error: "Payment has already been processed" },
          { status: 400 }
        );
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: params.id },
        data: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          approvedById: session.user.id,
          approvedAt: new Date(),
          notes: notes,
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

      return NextResponse.json(updatedPayment);
    } else {
      // Regular payment update (only allowed for payment owner and only if pending)
      if (payment.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (payment.status !== "PENDING") {
        return NextResponse.json(
          { error: "Cannot edit payment that has been processed" },
          { status: 400 }
        );
      }

      const validatedData = updatePaymentSchema.parse(body);

      // Validate amount against donation target if provided
      if (validatedData.amount && validatedData.amount > Number(payment.donation.targetAmount)) {
        return NextResponse.json(
          { error: "Payment amount cannot exceed target amount" },
          { status: 400 }
        );
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: params.id },
        data: validatedData,
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

      return NextResponse.json(updatedPayment);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Only payment owner can delete, and only if pending
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cannot delete payment that has been processed" },
        { status: 400 }
      );
    }

    await prisma.payment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}