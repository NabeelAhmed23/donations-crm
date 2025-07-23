import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find all managers and vice managers who are not managing any donations
    const usersToUpdate = await prisma.user.findMany({
      where: {
        role: {
          in: ["MANAGER", "VICE_MANAGER"]
        }
      },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        _count: {
          select: {
            managedDonations: true,
            viceManagerDonations: true,
          },
        },
      },
    });

    const usersToDemote = usersToUpdate.filter(user => 
      user._count.managedDonations === 0 && user._count.viceManagerDonations === 0
    );

    if (usersToDemote.length === 0) {
      return NextResponse.json({ message: "No users to demote", demotedUsers: [] });
    }

    // Auto-demote users to USER role
    const demotedUsers = [];
    for (const user of usersToDemote) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: "USER" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });
      demotedUsers.push(updatedUser);
    }

    return NextResponse.json({ 
      message: `Auto-demoted ${demotedUsers.length} users to USER role`,
      demotedUsers 
    });
  } catch (error) {
    console.error("Failed to auto-demo te users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}