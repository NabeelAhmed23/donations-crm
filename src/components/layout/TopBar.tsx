"use client";

import { useSession, signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { User, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";

export function TopBar() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold tracking-tight lg:hidden">
              Donations Dashboard
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />

            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="hidden sm:block space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initials =
    session.user.firstName && session.user.lastName
      ? `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase()
      : session.user.name
      ? session.user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold tracking-tight lg:hidden">
            Donations Dashboard
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 h-auto">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">
                      {session.user.name ||
                        `${session.user.firstName || ""} ${
                          session.user.lastName || ""
                        }`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.role}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/my-account" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
