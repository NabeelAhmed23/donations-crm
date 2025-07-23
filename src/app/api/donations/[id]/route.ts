import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDonationSchema = z.object({
  name: z.string().min(1, "Donation name is required").optional(),
  description: z.string().optional(),
  type: z.enum(["COMPULSORY", "NON_COMPULSORY"]).optional(),
  targetAmount: z.number().positive("Target amount must be positive").optional(),
  dueDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  year: z.number().int().min(2020).max(2030).optional(),
  managerId: z.string().min(1, "Manager is required").optional(),
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

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payments: {
          include: {
            user: {
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
        },
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    const totalPaid = await prisma.payment.aggregate({
      where: {
        donationId: donation.id,
        status: "APPROVED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalPaidAmount = Number(totalPaid._sum.amount || 0);
    const targetAmount = Number(donation.targetAmount);
    
    const donationWithStats = {
      ...donation,
      totalPaid: totalPaidAmount,
      remainingAmount: targetAmount - totalPaidAmount,
    };

    return NextResponse.json(donationWithStats);
  } catch (error) {
    console.error("Error fetching donation:", error);
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "MANAGER", "VICE_MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateDonationSchema.parse(body);

    if (validatedData.managerId) {
      const manager = await prisma.user.findUnique({
        where: { 
          id: validatedData.managerId,
          role: { in: ["MANAGER", "VICE_MANAGER", "ADMIN"] }
        },
      });

      if (!manager) {
        return NextResponse.json(
          { error: "Invalid manager selected" },
          { status: 400 }
        );
      }
    }

    const updatedDonation = await prisma.donation.update({
      where: { id },
      data: validatedData,
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
    });

    return NextResponse.json(updatedDonation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating donation:", error);
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
    const { id } = await params;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    if (donation._count.payments > 0) {
      return NextResponse.json(
        { error: "Cannot delete donation with existing payments" },
        { status: 400 }
      );
    }

    await prisma.donation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Donation deleted successfully" });
  } catch (error) {
    console.error("Error deleting donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}