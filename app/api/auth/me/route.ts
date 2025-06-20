import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeaders } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    let token = extractTokenFromHeaders(request);

    if (!token) {
      const cookieToken = request.cookies.get("auth-token");
      token = cookieToken?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Token tidak valid" },
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
