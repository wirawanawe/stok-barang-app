import { NextRequest, NextResponse } from "next/server";
import { verifyToken, validateSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie (since middleware doesn't process /api/auth routes)
    let token = request.cookies.get("auth-token")?.value;

    if (!token) {
      // Also check Authorization header as fallback
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Token tidak valid" },
        { status: 401 }
      );
    }

    // Validate session in database
    const sessionValidation = await validateSession(token);
    if (!sessionValidation.valid) {
      return NextResponse.json(
        { success: false, message: "Session tidak valid atau telah expired" },
        { status: 401 }
      );
    }

    // Get fresh user data from database with optimized query
    const userQuery = `
      SELECT id, username, email, full_name, role, is_active
      FROM users 
      WHERE id = ? AND is_active = true
      LIMIT 1
    `;

    const result = await executeQuery(userQuery, [decoded.userId]);

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const user = result.data[0] as any;

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
