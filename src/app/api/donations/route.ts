import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createDonationSchema = z
  .object({
    name: z.string().min(1, "Donation name is required"),
    description: z.string().optional(),
    type: z.enum(["COMPULSORY", "NON_COMPULSORY"]),
    dueDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    year: z.number().int().min(2020).max(2030),
    managerId: z.string().min(1, "Manager is required"),
    userDonations: z
      .array(
        z.object({
          userId: z.string().min(1, "User is required"),
          targetAmount: z
            .preprocess(
              (val) => (val === null || val === undefined ? 0 : val),
              z.number()
            )
            .optional(),
          paid: z.boolean().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.type !== "COMPULSORY" ||
      (data.dueDate instanceof Date && !isNaN(data.dueDate.getTime())),
    {
      message: "Due date is required for compulsory donations",
      path: ["dueDate"],
    }
  );

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const whereClause: Record<string, string | number | boolean> = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    if (type) {
      whereClause.type = type;
    }

    const donations = await prisma.donation.findMany({
      where: whereClause,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userDonations: {
          select: {
            id: true,
            userId: true,
            targetAmount: true,
            paid: true,
            donationId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            payments: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const donationsWithStats = await Promise.all(
      donations.map(async (donation) => {
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
        // Use personalized targetAmount if available, else fallback to donation.targetAmount
        const userDonation = donation.userDonations.find(
          (item) => item.donationId === donation.id
        );
        const targetAmount =
          userDonation?.targetAmount !== undefined
            ? Number(userDonation.targetAmount)
            : Number(userDonation?.targetAmount ?? 0);

        return {
          ...donation,
          totalPaid: totalPaidAmount,
          remainingAmount: targetAmount - totalPaidAmount,
        };
      })
    );

    return NextResponse.json(donationsWithStats);
  } catch {
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "MANAGER", "VICE_MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createDonationSchema.parse(body);

    const manager = await prisma.user.findUnique({
      where: {
        id: validatedData.managerId,
        role: { in: ["MANAGER", "VICE_MANAGER", "ADMIN"] },
      },
    });

    if (!manager) {
      return NextResponse.json(
        { error: "Invalid manager selected" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        dueDate: validatedData.dueDate,
        year: validatedData.year,
        managerId: validatedData.managerId,
      },
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

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error("Error creating donation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
