import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Delete session from database
      await executeQuery(
        "DELETE FROM customer_sessions WHERE session_token = ?",
        [token]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Customer logout error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
