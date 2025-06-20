import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Ambil semua categories
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM categories ORDER BY name ASC"
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tambah category baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Category created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
