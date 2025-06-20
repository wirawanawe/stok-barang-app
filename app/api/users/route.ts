import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin from middleware headers
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya admin yang diizinkan.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    // Build query with filters
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause +=
        " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += " AND is_active = ?";
      queryParams.push(status === "active" ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);

    if (!countResult.success) {
      throw new Error("Failed to get user count");
    }

    const total = (countResult.data as any)[0].total;

    // Simple query first to test
    if (queryParams.length === 0) {
      // No search/filter parameters - use simple query
      const usersQuery = `
        SELECT id, username, email, full_name, role, is_active, created_at, updated_at
        FROM users 
        WHERE is_active = 1
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await executeQuery(usersQuery, []);

      if (!result.success) {
        throw new Error("Failed to fetch users");
      }

      return NextResponse.json({
        success: true,
        data: {
          users: result.data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    }

    // Complex query with parameters
    const usersQuery = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log("🔍 Query Debug:", {
      query: usersQuery,
      params: queryParams,
      paramsCount: queryParams.length,
    });

    const result = await executeQuery(usersQuery, queryParams);

    if (!result.success) {
      throw new Error("Failed to fetch users");
    }

    return NextResponse.json({
      success: true,
      data: {
        users: result.data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya admin yang diizinkan.",
        },
        { status: 403 }
      );
    }

    const { username, email, password, full_name, role, is_active } =
      await request.json();

    // Validation
    if (!username || !email || !password || !full_name) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const checkQuery = `
      SELECT id FROM users 
      WHERE username = ? OR email = ?
    `;
    const checkResult = await executeQuery(checkQuery, [username, email]);

    if (!checkResult.success) {
      throw new Error("Failed to check existing user");
    }

    if (Array.isArray(checkResult.data) && checkResult.data.length > 0) {
      return NextResponse.json(
        { success: false, message: "Username atau email sudah digunakan" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (username, email, password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const insertResult = await executeQuery(insertQuery, [
      username,
      email,
      hashedPassword,
      full_name,
      role || "user",
      is_active !== undefined ? is_active : true,
    ]);

    if (!insertResult.success) {
      throw new Error("Failed to create user");
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil dibuat",
      data: {
        id: (insertResult.data as any).insertId,
        username,
        email,
        full_name,
        role: role || "user",
        is_active: is_active !== undefined ? is_active : true,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
