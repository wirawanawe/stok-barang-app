import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "ID user tidak valid" },
        { status: 400 }
      );
    }

    const query = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE id = ?
    `;

    const result = await executeQuery(query, [userId]);

    if (!result.success) {
      throw new Error("Failed to fetch user");
    }

    if (!Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data[0],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "ID user tidak valid" },
        { status: 400 }
      );
    }

    const { username, email, password, full_name, role, is_active } =
      await request.json();

    // Validation
    if (!username || !email || !full_name) {
      return NextResponse.json(
        {
          success: false,
          message: "Username, email, dan nama lengkap wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const checkQuery = `SELECT id FROM users WHERE id = ?`;
    const checkResult = await executeQuery(checkQuery, [userId]);

    if (
      !checkResult.success ||
      !Array.isArray(checkResult.data) ||
      checkResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if username or email already exists for other users
    const duplicateQuery = `
      SELECT id FROM users 
      WHERE (username = ? OR email = ?) AND id != ?
    `;
    const duplicateResult = await executeQuery(duplicateQuery, [
      username,
      email,
      userId,
    ]);

    if (!duplicateResult.success) {
      throw new Error("Failed to check duplicate user");
    }

    if (
      Array.isArray(duplicateResult.data) &&
      duplicateResult.data.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau email sudah digunakan oleh user lain",
        },
        { status: 400 }
      );
    }

    // Build update query
    let updateQuery = `
      UPDATE users 
      SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let queryParams = [
      username,
      email,
      full_name,
      role || "user",
      is_active !== undefined ? is_active : true,
    ];

    // Add password if provided
    if (password) {
      const hashedPassword = await hashPassword(password);
      updateQuery = `
        UPDATE users 
        SET username = ?, email = ?, password = ?, full_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      `;
      queryParams = [
        username,
        email,
        hashedPassword,
        full_name,
        role || "user",
        is_active !== undefined ? is_active : true,
      ];
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(userId);

    const updateResult = await executeQuery(updateQuery, queryParams);

    if (!updateResult.success) {
      throw new Error("Failed to update user");
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil diupdate",
      data: {
        id: userId,
        username,
        email,
        full_name,
        role: role || "user",
        is_active: is_active !== undefined ? is_active : true,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get("x-user-role");
    const currentUserId = request.headers.get("x-user-id");

    if (userRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya admin yang diizinkan.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "ID user tidak valid" },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (currentUserId && parseInt(currentUserId) === userId) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus akun sendiri" },
        { status: 400 }
      );
    }

    // Check if user exists
    const checkQuery = `SELECT id, username FROM users WHERE id = ?`;
    const checkResult = await executeQuery(checkQuery, [userId]);

    if (
      !checkResult.success ||
      !Array.isArray(checkResult.data) ||
      checkResult.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete (deactivate) instead of hard delete to maintain data integrity
    const deleteQuery = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const deleteResult = await executeQuery(deleteQuery, [userId]);

    if (!deleteResult.success) {
      throw new Error("Failed to delete user");
    }

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
