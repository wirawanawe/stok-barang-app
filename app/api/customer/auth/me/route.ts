import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-fallback-secret-key"
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Token tidak valid" },
        { status: 401 }
      );
    }

    if (decoded.type !== "customer") {
      return NextResponse.json(
        { success: false, message: "Token tidak valid untuk customer" },
        { status: 401 }
      );
    }

    // Check if session exists and is valid
    const sessionResult = await executeQuery(
      "SELECT * FROM customer_sessions WHERE session_token = ? AND expires_at > NOW()",
      [token]
    );

    if (
      !sessionResult.success ||
      !Array.isArray(sessionResult.data) ||
      sessionResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau sudah kedaluwarsa" },
        { status: 401 }
      );
    }

    // Get customer data
    const customerResult = await executeQuery(
      "SELECT id, customer_code, name, email, full_name, phone, address, city, postal_code, is_active FROM customers WHERE id = ?",
      [decoded.customerId]
    );

    if (
      !customerResult.success ||
      !Array.isArray(customerResult.data) ||
      customerResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Customer tidak ditemukan" },
        { status: 404 }
      );
    }

    const customer = customerResult.data[0] as any;

    if (!customer.is_active) {
      return NextResponse.json(
        { success: false, message: "Akun tidak aktif" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Customer me error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
