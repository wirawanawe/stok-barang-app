import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import * as XLSX from "xlsx";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Query untuk mengambil data customers
    let query = `
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
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query +=
        " AND (name LIKE ? OR email LIKE ? OR customer_code LIKE ? OR full_name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status !== "all") {
      query += " AND is_active = ?";
      params.push(status === "active" ? 1 : 0);
    }

    query += " ORDER BY name ASC";

    const connection = await getDbConnection();
    const [rows] = await connection.execute(query, params);
    const customers = rows as any[];

    if (format === "excel") {
      // Format data untuk Excel
      const excelData = customers.map((customer, index) => ({
        No: index + 1,
        "Kode Customer": customer.customer_code,
        Username: customer.name,
        "Nama Lengkap": customer.full_name || "-",
        Email: customer.email,
        "No. Telepon": customer.phone || "-",
        Alamat: customer.address || "-",
        Kota: customer.city || "-",
        "Kode Pos": customer.postal_code || "-",
        Status: customer.is_active ? "Aktif" : "Nonaktif",
        "Tanggal Daftar": new Date(customer.created_at).toLocaleDateString(
          "id-ID"
        ),
        "Terakhir Update": new Date(customer.updated_at).toLocaleDateString(
          "id-ID"
        ),
      }));

      // Buat workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const wscols = [
        { wch: 5 }, // No
        { wch: 15 }, // Kode Customer
        { wch: 20 }, // Username
        { wch: 25 }, // Nama Lengkap
        { wch: 25 }, // Email
        { wch: 15 }, // Telepon
        { wch: 35 }, // Alamat
        { wch: 15 }, // Kota
        { wch: 10 }, // Kode Pos
        { wch: 10 }, // Status
        { wch: 15 }, // Tanggal Daftar
        { wch: 15 }, // Update
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Data Customer");

      // Generate buffer
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `data-customer-${currentDate}.xlsx`;

      return new NextResponse(buf, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return JSON data untuk PDF
      return NextResponse.json({
        success: true,
        data: customers,
        meta: {
          total: customers.length,
          exported_at: new Date().toISOString(),
          filters: { search, status },
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data" },
      { status: 500 }
    );
  }
}
