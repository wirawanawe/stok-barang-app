import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stok_barang",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const db = mysql.createPool(dbConfig);

// Test koneksi database
export async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Query helper functions
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // If no parameters, use query() instead of execute()
    if (params.length === 0) {
      const [results] = await db.query(query);
      return { success: true, data: results };
    }

    const [results] = await db.execute(query, params);
    return { success: true, data: results };
  } catch (error) {
    console.error("Database query error:", error);
    return { success: false, error };
  }
}
