import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Get all enabled page access controls (public for all authenticated users)
export async function GET(request: NextRequest) {
  try {
    // This endpoint is public but we still need to verify basic authentication
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      // Return default enabled pages if no token (for basic functionality)
      return NextResponse.json({
        success: true,
        data: [
          {
            page_key: "dashboard",
            page_name: "Dashboard",
            page_path: "/dashboard",
            is_enabled: true,
            required_role: "user",
            category: "main",
            sort_order: 1,
          },
          {
            page_key: "customer_shop",
            page_name: "Shop",
            page_path: "/shop",
            is_enabled: true,
            required_role: "user",
            category: "customer",
            sort_order: 1,
          },
        ],
      });
    }

    const result = await executeQuery(`
      SELECT 
        id, page_key, page_name, page_path, description, 
        is_enabled, required_role, category, sort_order
      FROM page_access 
      WHERE is_enabled = 1
      ORDER BY category, sort_order, page_name
    `);

    if (!result.success) {
      // Return basic pages if database fails
      return NextResponse.json({
        success: true,
        data: [
          {
            page_key: "dashboard",
            page_name: "Dashboard",
            page_path: "/dashboard",
            is_enabled: true,
            required_role: "user",
            category: "main",
            sort_order: 1,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Public pages fetch error:", error);

    // Return basic pages on error to ensure app functionality
    return NextResponse.json({
      success: true,
      data: [
        {
          page_key: "dashboard",
          page_name: "Dashboard",
          page_path: "/dashboard",
          is_enabled: true,
          required_role: "user",
          category: "main",
          sort_order: 1,
        },
      ],
    });
  }
}
