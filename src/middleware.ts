import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register", 
    "/forgot-password",
    "/reset-password",
  ]
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === "/"

  // Admin-only routes
  const adminRoutes = [
    "/dashboard/admin",
  ]
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // If accessing protected route without authentication, redirect to login
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (isLoggedIn && isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If accessing admin route without admin role, redirect to dashboard
  if (isAdminRoute && isLoggedIn && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
}
