const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminInteractive() {
  try {
    console.log("🔐 Setup Admin User - Database Connection");
    console.log("=====================================\n");

    const dbHost =
      (await question("Database Host (default: localhost): ")) || "localhost";
    const dbUser =
      (await question("Database User (default: root): ")) || "root";
    const dbPassword = await question("Database Password: ");
    const dbName =
      (await question("Database Name (default: stok_barang): ")) ||
      "stok_barang";

    console.log("\n⏳ Connecting to database...");

    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    console.log("✅ Database connected successfully!");

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

    console.log("\n🎉 Admin user created/updated successfully!");
    console.log("=====================================");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@stokbarang.com");
    console.log("Role: admin");
    console.log("=====================================\n");

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Tips:");
      console.log("- Check your MySQL username and password");
      console.log("- Make sure MySQL server is running");
      console.log("- Try connecting with: mysql -u root -p");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 Tips:");
      console.log('- Database "stok_barang" doesn\'t exist');
      console.log("- Create it first: CREATE DATABASE stok_barang;");
      console.log("- Or run the database.sql file");
    }
  } finally {
    rl.close();
  }
}

createAdminInteractive();
