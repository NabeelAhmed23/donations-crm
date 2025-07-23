import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  role: z.enum(["USER", "MANAGER", "VICE_MANAGER", "ADMIN"]).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  education: z.string().optional(),
  maritalStatus: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        education: true,
        maritalStatus: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            managedDonations: true,
            viceManagerDonations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if role is being changed
    if (validatedData.role) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: {
          role: true,
          _count: {
            select: {
              managedDonations: true,
              viceManagerDonations: true,
            },
          },
        },
      });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user is currently managing donations
      const isManagingDonations =
        currentUser._count.managedDonations > 0 ||
        currentUser._count.viceManagerDonations > 0;

      // Prevent role change if user is managing donations and role is not USER
      if (isManagingDonations && validatedData.role !== "USER") {
        return NextResponse.json(
          {
            error:
              "Cannot change role while user is managing donations. Please remove user from all donations first.",
          },
          { status: 400 }
        );
      }
    }

    // Clean up the dateOfBirth field to handle undefined properly
    const updateData = { ...validatedData };
    if (updateData.dateOfBirth === undefined) {
      delete updateData.dateOfBirth;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        education: true,
        maritalStatus: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        country: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.message },
        { status: 400 }
      );
    }

    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
