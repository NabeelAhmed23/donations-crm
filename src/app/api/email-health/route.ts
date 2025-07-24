import { transporter } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await transporter.verify();
    return NextResponse.json(
      { message: "Email connection verified" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to verify email connection" },
      { status: 500 }
    );
  }
}
