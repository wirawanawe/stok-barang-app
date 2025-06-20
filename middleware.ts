import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Define protected routes that require authentication
const protectedRoutes = [
  "/items",
  "/reports",
  "/settings",
  "/transactions",
  "/api/items",
  "/api/categories",
  "/api/locations",
  "/api/stock-logs",
  "/api/dashboard",
  "/api/users",
];

// Define admin-only routes
const adminOnlyRoutes = [
  "/settings",
  "/api/categories",
  "/api/locations",
  "/api/users",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page, API auth routes, and static files
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  let token = request.cookies.get("auth-token")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const decoded = await verifyToken(token);
  if (!decoded) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminOnlyRoute && decoded.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Hanya admin yang diizinkan." },
      { status: 403 }
    );
  }

  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", decoded.userId.toString());
  requestHeaders.set("x-user-role", decoded.role);
  requestHeaders.set("x-username", decoded.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
