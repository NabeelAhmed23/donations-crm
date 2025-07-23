import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userDonationSchema = z.object({
  donationId: z.string().min(1, "Donation ID is required"),
  userId: z.string().min(1, "User ID is required"),
  targetAmount: z.number().min(0, "Target amount must be non-negative"),
});

const updateUserDonationSchema = z.object({
  id: z.string().min(1, "ID is required"),
  userId: z.string().min(1, "User ID is required"),
  donationId: z.string().min(1, "Donation ID is required"),
  targetAmount: z.number().min(0, "Target amount must be non-negative"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.message },
        { status: 400 }
      );
    }
    const { donationId, userId, targetAmount } = parsed.data;

    // Check for existing user-donation pair
    const existing = await prisma.userDonation.findUnique({
      where: { userId_donationId: { userId, donationId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User donation already exists for this user and donation." },
        { status: 409 }
      );
    }

    const userDonation = await prisma.userDonation.create({
      data: {
        donationId,
        userId,
        targetAmount,
      },
    });
    return NextResponse.json(userDonation, { status: 201 });
  } catch (error) {
    console.error("Error creating user donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateUserDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.message },
        { status: 400 }
      );
    }
    const { id, userId, donationId, targetAmount } = parsed.data;

    // Check if the record exists
    const existing = await prisma.userDonation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "User donation not found." },
        { status: 404 }
      );
    }

    // Optionally, check for duplicate userId+donationId if userId or donationId changed
    if (
      (existing.userId !== userId || existing.donationId !== donationId) &&
      (await prisma.userDonation.findUnique({
        where: { userId_donationId: { userId, donationId } },
      }))
    ) {
      return NextResponse.json(
        { error: "User donation already exists for this user and donation." },
        { status: 409 }
      );
    }

    const updated = await prisma.userDonation.update({
      where: { id },
      data: { userId, donationId, targetAmount },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
