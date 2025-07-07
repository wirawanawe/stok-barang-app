import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeQuery } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // Find customer by email
    const customerResult = await executeQuery(
      "SELECT id, customer_code, name, email, password, full_name, phone, address, city, postal_code, is_active FROM customers WHERE email = ?",
      [email]
    );

    if (
      !customerResult.success ||
      !Array.isArray(customerResult.data) ||
      customerResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const customer = customerResult.data[0] as any;

    if (!customer.is_active) {
      return NextResponse.json(
        { success: false, message: "Akun Anda tidak aktif" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        type: "customer",
      },
      process.env.JWT_SECRET || "your-fallback-secret-key",
      { expiresIn: "24h" }
    );

    // Save session to database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await executeQuery(
      "INSERT INTO customer_sessions (customer_id, session_token, expires_at) VALUES (?, ?, ?)",
      [customer.id, token, expiresAt]
    );

    // Remove password from response
    const { password: _, ...customerData } = customer;

    return NextResponse.json({
      success: true,
      token,
      customer: customerData,
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
