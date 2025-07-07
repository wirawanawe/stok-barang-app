import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada file gambar yang ditemukan" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "items");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const uploadedUrls: string[] = [];

    // Process each file
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, message: `${file.name} bukan file gambar` },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: `${file.name} terlalu besar. Maksimal 5MB`,
          },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = path.extname(file.name);
      const filename = `item-${timestamp}-${random}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Convert File to Buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Add URL to results
      uploadedUrls.push(`/uploads/items/${filename}`);
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedUrls.length} gambar berhasil diupload`,
      data: {
        urls: uploadedUrls,
      },
    });
  } catch (error) {
    console.error("Error uploading item images:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupload gambar" },
      { status: 500 }
    );
  }
}
