import mysql from "mysql2/promise";

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stok_barang",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // MySQL2-specific options
  idleTimeout: 60000,
  maxIdle: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Connection pool
let pool: mysql.Pool | null = null;

export async function getDbConnection(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Test koneksi database
export async function testConnection() {
  try {
    const connection = await getDbConnection();
    await connection.execute("SELECT 1");
    console.log("✅ MySQL Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MySQL Database connection failed:", error);
    return false;
  }
}

// Query helper functions
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const pool = await getDbConnection();

    // For pool connections, use query method instead of execute
    // as pool.execute() can have issues with parameter binding

    const [results] = await pool.query(query, params);
    return { success: true, data: results };
  } catch (error) {
    console.error("MySQL Database query error:", error);
    return { success: false, error };
  }
}

// Legacy compatibility (keeping for existing code)
export const db = {
  query: async (query: string, params: any[] = []) => {
    const connection = await getDbConnection();
    const [results] = await connection.execute(query, params);
    return [results];
  },
  execute: async (query: string, params: any[] = []) => {
    const connection = await getDbConnection();
    const [results] = await connection.execute(query, params);
    return [results];
  },
};

// For backward compatibility with SQLite methods
export async function openDb() {
  return await getDbConnection();
}
