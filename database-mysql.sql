-- MySQL Database Schema untuk Aplikasi Stok Barang
-- Versi MySQL yang menggantikan database-sqlite.sql

CREATE DATABASE IF NOT EXISTS stok_barang;
USE stok_barang;

-- Tabel Users (Admin/Staff)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel User Sessions untuk mengelola login token
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_session (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_expires (expires_at)
);

-- Tabel Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Locations
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Items (Barang)
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    location_id INT,
    quantity INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    max_stock INT DEFAULT 1000,
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
    price DECIMAL(15,2) DEFAULT 0.00,
    online_price DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    is_available_online BOOLEAN DEFAULT true,
    min_order_qty INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_location (location_id),
    INDEX idx_is_active (is_active)
);

-- Tabel Stock Logs (Riwayat Transaksi)
CREATE TABLE IF NOT EXISTS stock_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    current_stock INT NOT NULL,
    notes TEXT,
    reference_no VARCHAR(100),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_item_date (item_id, transaction_date),
    INDEX idx_type (type),
    INDEX idx_user (user_id)
);

-- Tabel Customers untuk e-commerce
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Customer Sessions
CREATE TABLE IF NOT EXISTS customer_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_customer (customer_id)
);

-- Tabel Shopping Cart
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, item_id),
    INDEX idx_customer_cart (customer_id)
);

-- Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    shipping_name VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(10) NOT NULL,
    shipping_notes TEXT,
    payment_method ENUM('transfer', 'cod', 'ewallet') DEFAULT 'transfer',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    special_instructions TEXT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_orders (customer_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
);

-- Tabel Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_item (item_id)
);

-- Insert data awal
-- Default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password, full_name, role) VALUES 
('admin', 'admin@stokbarang.com', '$2a$10$rQ1.kH5R9B0w8I7ZMr7OVOKkP3gWfLyC.YZdVtNXmJqK2mF9ZLc/S', 'Administrator', 'admin');

-- Default categories
INSERT IGNORE INTO categories (name, description) VALUES 
('Elektronik', 'Barang-barang elektronik'),
('Furniture', 'Perabotan kantor dan rumah'),
('ATK', 'Alat Tulis Kantor'),
('Konsumsi', 'Barang konsumsi'),
('Lainnya', 'Kategori lainnya');

-- Default locations
INSERT IGNORE INTO locations (name, description) VALUES 
('Gudang A', 'Gudang utama lantai 1'),
('Gudang B', 'Gudang lantai 2'),
('Ruang Server', 'Ruang khusus server dan IT'),
('Kantor', 'Area perkantoran'),
('Workshop', 'Area workshop dan maintenance');

-- Sample items
INSERT IGNORE INTO items (code, name, description, category_id, location_id, quantity, unit, price, min_stock, online_price) VALUES 
('BRG001', 'Laptop Dell Inspiron', 'Laptop untuk karyawan', 1, 3, 10, 'Unit', 8000000, 2, 8800000),
('BRG002', 'Meja Kantor', 'Meja kantor kayu jati', 2, 4, 15, 'Unit', 1500000, 3, 1650000),
('BRG003', 'Kertas A4', 'Kertas HVS A4 80gr', 3, 1, 100, 'Rim', 45000, 20, 49500),
('BRG004', 'Mouse Wireless', 'Mouse wireless Logitech', 1, 1, 25, 'Unit', 150000, 5, 165000);

-- Sample customers (password: password)
INSERT IGNORE INTO customers (email, password, full_name, phone, address, city, postal_code) VALUES
('customer1@example.com', '$2b$10$8K1p/a0dUrziu6HCh/PaE.Jd/8fHYpLOwE8RYbxNNfLnzKj7yiVjm', 'John Doe', '081234567890', 'Jl. Merdeka No. 123', 'Jakarta', '12345'),
('customer2@example.com', '$2b$10$8K1p/a0dUrziu6HCh/PaE.Jd/8fHYpLOwE8RYbxNNfLnzKj7yiVjm', 'Jane Smith', '081234567891', 'Jl. Sudirman No. 456', 'Bandung', '67890');

-- Procedure untuk cleanup expired sessions
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupExpiredSessions()
BEGIN
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at <= NOW() AND is_active = true;
    
    UPDATE customer_sessions 
    SET expires_at = NOW() 
    WHERE expires_at <= NOW();
END //
DELIMITER ;

-- Event scheduler untuk membersihkan session expired (opsional)
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_sessions
-- ON SCHEDULE EVERY 1 HOUR
-- DO
--   CALL CleanupExpiredSessions();

SELECT 'MySQL Database schema berhasil dibuat!' as status; 