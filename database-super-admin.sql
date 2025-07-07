-- Super Admin Database Migration
-- This adds super admin role and feature control system

USE stok_barang;

-- 1. Update users table to add super_admin role
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user';

-- 2. Create feature_toggles table to control which features are enabled
CREATE TABLE feature_toggles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_feature_key (feature_key),
  INDEX idx_category (category)
);

-- 3. Create page_access table to control which pages are accessible
CREATE TABLE page_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(100) UNIQUE NOT NULL,
  page_name VARCHAR(200) NOT NULL,
  page_path VARCHAR(300) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  required_role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
  category VARCHAR(50) DEFAULT 'main',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_key (page_key),
  INDEX idx_category (category),
  INDEX idx_role (required_role)
);

-- 4. Insert default feature toggles
INSERT INTO feature_toggles (feature_key, feature_name, description, category, is_enabled) VALUES
-- Core Features
('dashboard', 'Dashboard', 'Main dashboard access', 'core', true),
('items_management', 'Items Management', 'Stock items management', 'core', true),
('transactions', 'Transactions', 'Transaction management', 'core', true),
('customers', 'Customer Management', 'Customer management system', 'core', true),
('reports', 'Reports', 'Reporting system', 'core', true),

-- Admin Features
('user_management', 'User Management', 'User account management', 'admin', true),
('categories', 'Categories Management', 'Product categories management', 'admin', true),
('locations', 'Locations Management', 'Storage locations management', 'admin', true),
('website_settings', 'Website Settings', 'Website configuration', 'admin', true),
('news_management', 'News Management', 'News articles management', 'admin', true),

-- eCommerce Features
('customer_portal', 'Customer Portal', 'Customer frontend access', 'ecommerce', true),
('shopping_cart', 'Shopping Cart', 'Shopping cart functionality', 'ecommerce', true),
('checkout', 'Checkout Process', 'Order checkout system', 'ecommerce', true),
('order_confirmation', 'Order Confirmation', 'Order confirmation page', 'ecommerce', true),

-- Export Features
('export_items', 'Export Items', 'Items data export', 'export', true),
('export_customers', 'Export Customers', 'Customer data export', 'export', true),
('export_reports', 'Export Reports', 'Reports export functionality', 'export', true),

-- Advanced Features
('stock_logs', 'Stock Logs', 'Stock movement tracking', 'advanced', true),
('file_uploads', 'File Uploads', 'File upload functionality', 'advanced', true),
('api_access', 'API Access', 'External API access', 'advanced', true);

-- 5. Insert default page access controls
INSERT INTO page_access (page_key, page_name, page_path, description, required_role, category, sort_order, is_enabled) VALUES
-- Main Dashboard Pages
('dashboard', 'Dashboard', '/dashboard', 'Main dashboard page', 'user', 'main', 1, true),
('transactions', 'Transactions', '/dashboard/transactions', 'Transaction management page', 'user', 'main', 2, true),
('items', 'Items Management', '/dashboard/items', 'Stock items management page', 'user', 'main', 3, true),
('customers', 'Customers', '/dashboard/customers', 'Customer management page', 'user', 'main', 4, true),
('reports', 'Reports', '/dashboard/reports', 'Reports and analytics page', 'user', 'main', 5, true),

-- Admin Settings Pages
('settings_users', 'User Management', '/dashboard/settings/users', 'User account management', 'admin', 'settings', 1, true),
('settings_website', 'Website Settings', '/dashboard/settings/website', 'Website configuration', 'admin', 'settings', 2, true),
('settings_news', 'News Management', '/dashboard/settings/news', 'News articles management', 'admin', 'settings', 3, true),
('settings_locations', 'Locations', '/dashboard/settings/locations', 'Storage locations management', 'admin', 'settings', 4, true),
('settings_categories', 'Categories', '/dashboard/settings/categories', 'Product categories management', 'admin', 'settings', 5, true),

-- Customer Portal Pages
('customer_shop', 'Shop', '/shop', 'Customer shopping page', 'user', 'customer', 1, true),
('customer_cart', 'Shopping Cart', '/cart', 'Shopping cart page', 'user', 'customer', 2, true),
('customer_checkout', 'Checkout', '/checkout', 'Order checkout page', 'user', 'customer', 3, true),
('customer_confirmation', 'Order Confirmation', '/order-confirmation', 'Order confirmation page', 'user', 'customer', 4, true),

-- Auth Pages
('customer_login', 'Customer Login', '/customer/login', 'Customer login page', 'user', 'auth', 1, true),
('customer_register', 'Customer Register', '/customer/register', 'Customer registration page', 'user', 'auth', 2, true);

-- 6. Create super admin user (username: superadmin, password: SuperAdmin123!)
-- Password hash for 'SuperAdmin123!'
INSERT INTO users (username, email, password, full_name, role, is_active) VALUES 
('superadmin', 'superadmin@system.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxndCO3PSvqRPQV6G/lXu', 'Super Administrator', 'super_admin', true);

-- 7. Create system configuration table for super admin settings
CREATE TABLE system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type ENUM('string', 'boolean', 'number', 'json') DEFAULT 'string',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
);

-- Insert default system configurations
INSERT INTO system_config (config_key, config_value, config_type, description, is_system) VALUES
('hide_super_admin', 'true', 'boolean', 'Hide super admin role from regular users and admins', true),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode for the application', false),
('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', false),
('session_timeout', '86400', 'number', 'Session timeout in seconds (24 hours)', false),
('enable_registration', 'true', 'boolean', 'Allow new customer registration', false),
('enable_api_access', 'true', 'boolean', 'Enable external API access', false); 