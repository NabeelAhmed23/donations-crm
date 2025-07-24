import { prisma } from "@/lib/prisma";
import { Mailer, transporter } from "@/lib/mailer";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { addMinutes } from "date-fns";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always respond with success to avoid leaking user existence
  const genericSuccess = {
    message: "If the email exists, a reset link has been sent.",
  };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(genericSuccess);
    }

    // Generate token and expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = addMinutes(new Date(), 30);

    // Store token and expiry
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Send email
    const mailer = new Mailer(transporter);
    const resetUrl = `${
      process.env.AUTH_URL || "http://localhost:3000"
    }/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = "Reset your password";
    const text = `You requested a password reset. Click the link below to reset your password.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
    await mailer.sendEmail(email, subject, text);
    return NextResponse.json(genericSuccess);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
