import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeQuery } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, address, city, postal_code } =
      await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, dan nama lengkap harus diisi",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingResult = await executeQuery(
      "SELECT id FROM customers WHERE email = ?",
      [email]
    );

    if (
      existingResult.success &&
      Array.isArray(existingResult.data) &&
      existingResult.data.length > 0
    ) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique customer_code
    const customerCode =
      "CUST" +
      Date.now().toString().slice(-8) +
      Math.random().toString(36).substring(2, 4).toUpperCase();

    // Insert new customer
    const insertResult = await executeQuery(
      "INSERT INTO customers (customer_code, name, email, password, full_name, phone, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        customerCode,
        full_name, // Use full_name for both name and full_name fields
        email,
        hashedPassword,
        full_name,
        phone || null,
        address || null,
        city || null,
        postal_code || null,
      ]
    );

    if (!insertResult.success) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat akun" },
        { status: 500 }
      );
    }

    // Get the created customer
    const customerResult = await executeQuery(
      "SELECT id, customer_code, name, email, full_name, phone, address, city, postal_code FROM customers WHERE email = ?",
      [email]
    );

    if (
      !customerResult.success ||
      !Array.isArray(customerResult.data) ||
      customerResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Gagal mengambil data customer" },
        { status: 500 }
      );
    }

    const newCustomer = customerResult.data[0] as any;

    // Generate JWT token
    const token = jwt.sign(
      {
        customerId: newCustomer.id,
        email: newCustomer.email,
        type: "customer",
      },
      process.env.JWT_SECRET || "your-fallback-secret-key",
      { expiresIn: "24h" }
    );

    // Save session to database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await executeQuery(
      "INSERT INTO customer_sessions (customer_id, session_token, expires_at) VALUES (?, ?, ?)",
      [newCustomer.id, token, expiresAt]
    );

    return NextResponse.json({
      success: true,
      token,
      customer: newCustomer,
      message: "Akun berhasil dibuat",
    });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
