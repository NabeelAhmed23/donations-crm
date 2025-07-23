import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: ["MANAGER", "VICE_MANAGER"],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
