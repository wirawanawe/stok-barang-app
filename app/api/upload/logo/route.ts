import { NextRequest, NextResponse } from "next/server";
import { verifyTokenMiddleware, isAdmin } from "@/lib/auth-middleware";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyTokenMiddleware(token);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File logo tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ukuran file maksimal 2MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `logo-${timestamp}${extension}`;
    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the URL path
    const logoUrl = `/uploads/logos/${filename}`;

    return NextResponse.json({
      success: true,
      message: "Logo berhasil diupload",
      data: {
        url: logoUrl,
        filename,
      },
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupload logo" },
      { status: 500 }
    );
  }
}
