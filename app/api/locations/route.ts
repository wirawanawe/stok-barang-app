import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Ambil semua locations
export async function GET() {
  try {
    const result = await executeQuery(
      "SELECT * FROM locations ORDER BY name ASC"
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch locations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tambah location baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "INSERT INTO locations (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create location" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Location created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
