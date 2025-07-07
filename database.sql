-- Database untuk Aplikasi Stok Barang
CREATE DATABASE IF NOT EXISTS stok_barang;
USE stok_barang;

-- Tabel Users (Admin)
CREATE TABLE users (
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
CREATE TABLE user_sessions (
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
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Locations
CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Items (Barang)
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT,
  location_id INT,
  quantity INT DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(15,2) DEFAULT 0,
  min_stock INT DEFAULT 0,
  max_stock INT DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_category (category_id)
);

-- Tabel Stock Logs (Riwayat Transaksi)
CREATE TABLE stock_logs (
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
  INDEX idx_type (type)
);

-- Insert data awal
-- Default admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role) VALUES 
('admin', 'admin@stokbarang.com', '$2a$10$rQ1.kH5R9B0w8I7ZMr7OVOKkP3gWfLyC.YZdVtNXmJqK2mF9ZLc/S', 'Administrator', 'admin');

-- Default categories
INSERT INTO categories (name, description) VALUES 
('Elektronik', 'Barang-barang elektronik'),
('Furniture', 'Perabotan kantor dan rumah'),
('ATK', 'Alat Tulis Kantor'),
('Konsumsi', 'Barang konsumsi'),
('Lainnya', 'Kategori lainnya');

-- Default locations
INSERT INTO locations (name, description) VALUES 
('Gudang A', 'Gudang utama lantai 1'),
('Gudang B', 'Gudang lantai 2'),
('Ruang Server', 'Ruang khusus server dan IT'),
('Kantor', 'Area perkantoran'),
('Workshop', 'Area workshop dan maintenance');

-- Sample items
INSERT INTO items (code, name, description, category_id, location_id, quantity, unit, price, min_stock) VALUES 
('BRG001', 'Laptop Dell Inspiron', 'Laptop untuk karyawan', 1, 3, 10, 'Unit', 8000000, 2),
('BRG002', 'Meja Kantor', 'Meja kantor kayu jati', 2, 4, 15, 'Unit', 1500000, 3),
('BRG003', 'Kertas A4', 'Kertas HVS A4 80gr', 3, 1, 100, 'Rim', 45000, 20),
('BRG004', 'Mouse Wireless', 'Mouse wireless Logitech', 1, 1, 25, 'Unit', 150000, 5); 