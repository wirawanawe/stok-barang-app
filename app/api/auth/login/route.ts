import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifyPassword, generateToken, User } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Get user from database
    const userQuery = `
      SELECT id, username, email, password, full_name, role, is_active
      FROM users 
      WHERE (username = ? OR email = ?) AND is_active = true
    `;

    const result = await executeQuery(userQuery, [username, username]);

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      );
    }

    const user = result.data[0] as any;

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };

    const token = await generateToken(userData);

    // Set HTTP-only cookie for additional security
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        },
        token,
      },
    });

    // Set cookie with token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
