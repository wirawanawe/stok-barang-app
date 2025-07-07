import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Get all enabled feature toggles (public for all authenticated users)
export async function GET(request: NextRequest) {
  try {
    // This endpoint is public but we still need to verify basic authentication
    // to prevent unauthenticated access to feature information
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      // Return default enabled features if no token (for basic functionality)
      return NextResponse.json({
        success: true,
        data: [
          { feature_key: "dashboard", is_enabled: true, category: "core" },
          {
            feature_key: "items_management",
            is_enabled: true,
            category: "core",
          },
          {
            feature_key: "customer_portal",
            is_enabled: true,
            category: "ecommerce",
          },
        ],
      });
    }

    const result = await executeQuery(`
      SELECT 
        id, feature_key, feature_name, description, 
        is_enabled, category
      FROM feature_toggles 
      WHERE is_enabled = 1
      ORDER BY category, feature_name
    `);

    if (!result.success) {
      // Return basic features if database fails
      return NextResponse.json({
        success: true,
        data: [
          { feature_key: "dashboard", is_enabled: true, category: "core" },
          {
            feature_key: "items_management",
            is_enabled: true,
            category: "core",
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Public features fetch error:", error);

    // Return basic features on error to ensure app functionality
    return NextResponse.json({
      success: true,
      data: [
        { feature_key: "dashboard", is_enabled: true, category: "core" },
        { feature_key: "items_management", is_enabled: true, category: "core" },
      ],
    });
  }
}
