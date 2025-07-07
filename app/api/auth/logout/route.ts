import { NextRequest, NextResponse } from "next/server";
import { removeUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value;

    // Remove session from database if token exists
    if (token) {
      await removeUserSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });

    // Clear the authentication cookie completely
    response.cookies.delete("auth-token");

    // Also set empty cookie with past expiration as fallback
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: -1,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
