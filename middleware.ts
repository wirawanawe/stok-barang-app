import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenMiddleware } from "@/lib/auth-middleware";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/dashboard/items",
  "/dashboard/reports",
  "/dashboard/settings",
  "/dashboard/transactions",
  "/api/items",
  "/api/categories",
  "/api/locations",
  "/api/stock-logs",
  "/api/dashboard",
  "/api/users",
  "/api/pos",
  "/api/customers",
];

// Define admin-only routes
const adminOnlyRoutes = [
  "/dashboard/settings",
  "/api/categories",
  "/api/locations",
  "/api/users",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page, API auth routes, customer routes, and static files
  if (
    pathname.startsWith("/dashboard/login") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order-confirmation") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/customer/") || // Note the trailing slash to be more specific
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
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);
    // Clear any stale cookie that might exist
    response.cookies.delete("auth-token");
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: -1,
      expires: new Date(0),
      path: "/",
    });

    return response;
  }

  // Verify JWT token
  const decoded = await verifyTokenMiddleware(token);
  if (!decoded) {
    // Clear invalid cookie
    const loginUrl = new URL("/dashboard/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: -1,
      expires: new Date(0),
      path: "/",
    });

    return response;
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
  requestHeaders.set("x-session-token", token); // Pass token for session validation in API routes

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
