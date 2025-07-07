import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin for customers management
    if (userRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (
        customer_code LIKE ? OR 
        name LIKE ? OR 
        email LIKE ? OR 
        full_name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    if (status !== "all") {
      whereClause += ` AND is_active = ?`;
      queryParams.push(status === "active");
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM customers 
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);
    if (!countResult.success) {
      throw new Error("Failed to get count");
    }
    const total = parseInt((countResult.data as any[])[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get customers
    const customersQuery = `
      SELECT 
        id,
        customer_code,
        name,
        email,
        full_name,
        phone,
        address,
        city,
        postal_code,
        is_active,
        created_at,
        updated_at
      FROM customers 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const customersResult = await executeQuery(customersQuery, queryParams);
    if (!customersResult.success) {
      throw new Error("Failed to get customers");
    }

    return NextResponse.json({
      success: true,
      data: {
        customers: customersResult.data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data customer" },
      { status: 500 }
    );
  }
}
