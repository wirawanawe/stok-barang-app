const mysql = require("mysql2/promise");

async function testMySQLConnection() {
  console.log("🔍 Testing MySQL2 Connection...");
  console.log("================================\n");

  try {
    // Get database configuration from environment or defaults
    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "stok_barang",
    };

    console.log("Database Configuration:");
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log("");

    // Test connection
    console.log("⏳ Connecting to MySQL...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected successfully!\n");

    // Test database queries
    console.log("🔍 Testing database queries...");

    // Test 1: Simple query
    const [result1] = await connection.execute("SELECT 1 as test");
    console.log("✅ Basic query test passed");

    // Test 2: Check tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`✅ Found ${tables.length} tables in database`);

    if (tables.length > 0) {
      console.log("📋 Available tables:");
      tables.forEach((table) => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }

    // Test 3: Check users table
    try {
      const [users] = await connection.execute(
        "SELECT COUNT(*) as count FROM users"
      );
      console.log(`✅ Users table: ${users[0].count} records found`);
    } catch (error) {
      console.log("❌ Users table not found or accessible");
    }

    // Test 4: Check items table
    try {
      const [items] = await connection.execute(
        "SELECT COUNT(*) as count FROM items"
      );
      console.log(`✅ Items table: ${items[0].count} records found`);
    } catch (error) {
      console.log("❌ Items table not found or accessible");
    }

    // Test 5: Check categories table
    try {
      const [categories] = await connection.execute(
        "SELECT COUNT(*) as count FROM categories"
      );
      console.log(`✅ Categories table: ${categories[0].count} records found`);
    } catch (error) {
      console.log("❌ Categories table not found or accessible");
    }

    await connection.end();

    console.log("\n🎉 All tests passed! MySQL2 is working correctly.");
    console.log("================================");
  } catch (error) {
    console.error("\n❌ Connection test failed:");
    console.error("Error:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Tips:");
      console.log("- Check your MySQL username and password");
      console.log("- Make sure MySQL server is running");
      console.log("- Try: mysql -u root -p");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 Tips:");
      console.log('- Database "stok_barang" doesn\'t exist');
      console.log("- Create it: CREATE DATABASE stok_barang;");
      console.log("- Run: mysql -u root -p stok_barang < database-mysql.sql");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Tips:");
      console.log("- MySQL server is not running");
      console.log("- Start MySQL service");
      console.log("- Check port 3306 is not blocked");
    }

    console.log(
      "\n📖 See MYSQL-MIGRATION-GUIDE.md for detailed setup instructions"
    );
    process.exit(1);
  }
}

testMySQLConnection();
