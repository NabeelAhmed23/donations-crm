import { hashPassword, verifyPassword } from "@/lib/password-utils";
import { prisma } from "@/lib/prisma";
import { capitalize } from "@/lib/string";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const req = await request.json();
    const { token, password, email } = req;
    const fields = ["token", "password", "email"];
    const errors = fields
      .filter((field) => !req[field])
      .map((field) => capitalize(field));

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: `${errors.join(", ")} ${
            errors.length > 1 ? "are" : "is"
          } required`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.resetToken !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hasPasswordNotChanged = await verifyPassword(password, user.password!);
    console.log(hasPasswordNotChanged);
    if (hasPasswordNotChanged) {
      return NextResponse.json(
        {
          error:
            "You cannot use the same password. Please change your password to a new one.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
