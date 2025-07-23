"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  DollarSign,
  CreditCard,
  Users,
  LogOut,
  Menu,
  CheckCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TopBar } from "@/components/layout/TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Payments",
      href: "/dashboard/payments",
      icon: CreditCard,
    },
  ];

  // Add manage payments for managers, vice managers, and admins
  if (
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "VICE_MANAGER" ||
    session?.user?.role === "ADMIN"
  ) {
    navigation.push({
      name: "Donations",
      href: "/dashboard/donations",
      icon: DollarSign,
    });
  }

  // Add manage payments for managers, vice managers, and admins
  if (
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "VICE_MANAGER" ||
    session?.user?.role === "ADMIN"
  ) {
    navigation.push({
      name: "Manage Payments",
      href: "/dashboard/manage-payments",
      icon: CheckCircle,
    });
  }
  // Add manage donations for managers, vice managers, and admins
  if (
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "VICE_MANAGER" ||
    session?.user?.role === "ADMIN"
  ) {
    navigation.push({
      name: "Manage Donations",
      href: "/dashboard/manage-donations",
      icon: CheckCircle,
    });
  }

  if (session?.user?.role === "ADMIN") {
    navigation.push({
      name: "Users",
      href: "/dashboard/admin/users",
      icon: Users,
    });
  }

  const CustomSidebarContent = () => (
    <>
      <SidebarHeader className="border-b p-[14px]">
        <h1 className="font-bold text-lg">Donations Dashboard</h1>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4">
        <SidebarMenu className="space-y-2">
          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild className="w-full p-3">
                <Link
                  href={item.href}
                  className="flex items-center gap-4 text-sm"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-6">
        {session?.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {session.user.firstName?.[0] || session.user.name?.[0] || "U"}
                {session.user.lastName?.[0] ||
                  session.user.name?.split(" ")[1]?.[0] ||
                  ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.name ||
                    `${session.user.firstName || ""} ${
                      session.user.lastName || ""
                    }`.trim()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.user.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Logout"
              className="p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <div className="flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:block">
          <CustomSidebarContent />
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top Bar */}
          <TopBar />

          {/* Mobile Sidebar */}
          <Sheet>
            <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
              <h1 className="font-semibold text-lg">Dashboard</h1>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
            </div>

            <SheetContent side="left" className="p-0 w-64">
              <div className="flex flex-col h-full">
                <CustomSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
            <div className="w-full p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
