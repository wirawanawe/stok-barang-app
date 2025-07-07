-- SQLite compatible database schema for stok barang app

-- Users table for admin/staff authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for admin/staff
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER,
    location_id INTEGER,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',
    price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Stock logs table
CREATE TABLE IF NOT EXISTS stock_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item_id ON stock_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_user_id ON stock_logs(user_id);

-- Insert default admin user (username: admin, password: admin)
INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES
('admin', '$2b$10$8K1p/a0dUrziu6HCh/PaE.Jd/8fHYpLOwE8RYbxNNfLnzKj7yiVjm', 'Administrator', 'admin');

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES
('Cotton Combed', 'Kain cotton combed berkualitas premium'),
('Cotton Carded', 'Kain cotton carded dengan harga terjangkau'),
('CVC', 'Kain campuran cotton dan polyester'),
('Polyester', 'Kain polyester tahan lama'),
('Rayon', 'Kain rayon lembut dan nyaman');

-- Insert default locations
INSERT OR IGNORE INTO locations (name, description, address) VALUES
('Gudang Utama', 'Gudang penyimpanan utama', 'Jl. Industri No. 123'),
('Gudang Cabang A', 'Gudang cabang wilayah A', 'Jl. Cabang A No. 456'),
('Gudang Cabang B', 'Gudang cabang wilayah B', 'Jl. Cabang B No. 789');

-- Insert some sample items
INSERT OR IGNORE INTO items (code, name, description, category_id, location_id, quantity, min_stock, unit, price) VALUES
('KN001', 'Cotton Combed 30s', 'Kain cotton combed 30s berkualitas premium', 1, 1, 100, 10, 'meter', 45000),
('KN002', 'Cotton Combed 20s', 'Kain cotton combed 20s untuk kaos', 1, 1, 150, 15, 'meter', 40000),
('KN003', 'Cotton Carded 24s', 'Kain cotton carded 24s ekonomis', 2, 2, 200, 20, 'meter', 35000),
('KN004', 'CVC 30s', 'Kain CVC 30s campuran cotton polyester', 3, 1, 80, 10, 'meter', 38000),
('KN005', 'Polyester Active Dry', 'Kain polyester dengan teknologi quick dry', 4, 3, 120, 12, 'meter', 50000); 