const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "stok_barang",
  });

  try {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Insert or update admin user
    const query = `
      INSERT INTO users (username, email, password, full_name, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      password = VALUES(password),
      full_name = VALUES(full_name),
      role = VALUES(role)
    `;

    await connection.execute(query, [
      "admin",
      "admin@stokbarang.com",
      hashedPassword,
      "Administrator",
      "admin",
    ]);

    console.log("✅ Admin user created/updated successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@stokbarang.com");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await connection.end();
  }
}

createAdmin();
