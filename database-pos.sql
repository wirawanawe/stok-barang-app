-- Database schema for POS System
-- Run this script after the main database.sql

-- POS Transactions table
CREATE TABLE IF NOT EXISTS pos_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,
    user_id INT NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer') NOT NULL DEFAULT 'cash',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_transaction_number (transaction_number),
    INDEX idx_customer_id (customer_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);

-- POS Transaction Items table
CREATE TABLE IF NOT EXISTS pos_transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_item_id (item_id)
);

-- Update items table to add online_price field if not exists
-- Check if column exists first
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) = 0 THEN 'ALTER TABLE items ADD COLUMN online_price DECIMAL(10,2) DEFAULT 0 AFTER price'
        ELSE 'SELECT 1' 
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'items' 
    AND COLUMN_NAME = 'online_price'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update items table to ensure price column exists and has correct type
ALTER TABLE items 
MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Insert sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample POS transaction (uncomment if needed)
/*
INSERT INTO pos_transactions (
    transaction_number, customer_id, user_id, payment_method, 
    total_amount, paid_amount, change_amount, status
) VALUES (
    'POS-SAMPLE-001', NULL, 1, 'cash', 150000.00, 200000.00, 50000.00, 'completed'
);

-- Sample transaction items (uncomment if needed)
INSERT INTO pos_transaction_items (
    transaction_id, item_id, quantity, unit_price, total_price
) VALUES 
(1, 1, 2, 50000.00, 100000.00),
(1, 2, 1, 50000.00, 50000.00);
*/

-- Create view for POS reporting
CREATE OR REPLACE VIEW pos_transaction_summary AS
SELECT 
    DATE(pt.created_at) as transaction_date,
    COUNT(*) as total_transactions,
    SUM(pt.total_amount) as total_sales,
    SUM(CASE WHEN pt.payment_method = 'cash' THEN pt.total_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN pt.payment_method = 'card' THEN pt.total_amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN pt.payment_method = 'bank_transfer' THEN pt.total_amount ELSE 0 END) as bank_transfer_sales,
    AVG(pt.total_amount) as avg_transaction_amount
FROM pos_transactions pt
WHERE pt.status = 'completed'
GROUP BY DATE(pt.created_at)
ORDER BY transaction_date DESC;

-- Create view for popular items
CREATE OR REPLACE VIEW pos_popular_items AS
SELECT 
    i.id,
    i.code,
    i.name,
    i.category_id,
    c.name as category_name,
    SUM(pti.quantity) as total_sold,
    SUM(pti.total_price) as total_revenue,
    COUNT(DISTINCT pti.transaction_id) as transaction_count,
    AVG(pti.unit_price) as avg_price
FROM pos_transaction_items pti
JOIN items i ON pti.item_id = i.id
LEFT JOIN categories c ON i.category_id = c.id
JOIN pos_transactions pt ON pti.transaction_id = pt.id
WHERE pt.status = 'completed'
GROUP BY i.id, i.code, i.name, i.category_id, c.name
ORDER BY total_sold DESC;

-- Create indexes for better performance (ignore errors if index already exists)
CREATE INDEX idx_pos_transactions_created_at ON pos_transactions(created_at);
CREATE INDEX idx_pos_transaction_items_created_at ON pos_transaction_items(created_at);

-- Update stock_logs table to support POS transactions if needed
-- Check if column exists first
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) = 0 THEN 'ALTER TABLE stock_logs ADD COLUMN transaction_type ENUM(''manual'', ''pos'', ''online'', ''adjustment'') DEFAULT ''manual'' AFTER type'
        ELSE 'SELECT 1' 
    END
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stock_logs' 
    AND COLUMN_NAME = 'transaction_type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create trigger to automatically update stock_logs transaction_type for POS
DROP TRIGGER IF EXISTS update_stock_logs_pos_type;
DELIMITER //
CREATE TRIGGER update_stock_logs_pos_type
BEFORE INSERT ON stock_logs
FOR EACH ROW
BEGIN
    IF NEW.reference_no LIKE 'POS-%' THEN
        SET NEW.transaction_type = 'pos';
    END IF;
END//
DELIMITER ;

-- Grant permissions (adjust as needed for your user)
-- GRANT ALL PRIVILEGES ON pos_transactions TO 'your_user'@'localhost';
-- GRANT ALL PRIVILEGES ON pos_transaction_items TO 'your_user'@'localhost';

-- Create backup procedure for POS data
DROP PROCEDURE IF EXISTS backup_pos_transactions;
DELIMITER //
CREATE PROCEDURE backup_pos_transactions(IN backup_date DATE)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Create backup tables if they don't exist
    CREATE TABLE IF NOT EXISTS pos_transactions_backup LIKE pos_transactions;
    CREATE TABLE IF NOT EXISTS pos_transaction_items_backup LIKE pos_transaction_items;
    
    -- Insert data into backup tables
    INSERT INTO pos_transactions_backup 
    SELECT * FROM pos_transactions 
    WHERE DATE(created_at) = backup_date;
    
    INSERT INTO pos_transaction_items_backup 
    SELECT pti.* FROM pos_transaction_items pti
    JOIN pos_transactions pt ON pti.transaction_id = pt.id
    WHERE DATE(pt.created_at) = backup_date;
    
    COMMIT;
END//
DELIMITER ;

-- Create procedure to calculate daily sales
DROP PROCEDURE IF EXISTS get_daily_sales;
DELIMITER //
CREATE PROCEDURE get_daily_sales(IN sales_date DATE)
BEGIN
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN payment_method = 'bank_transfer' THEN total_amount ELSE 0 END) as bank_transfer_sales,
        AVG(total_amount) as avg_transaction_amount
    FROM pos_transactions
    WHERE DATE(created_at) = sales_date AND status = 'completed'
    GROUP BY DATE(created_at);
END//
DELIMITER ;

-- Sample queries for testing (uncomment if needed)
/*
-- Get today's sales
SELECT * FROM pos_transaction_summary WHERE transaction_date = CURDATE();

-- Get top 10 selling items
SELECT * FROM pos_popular_items LIMIT 10;

-- Get sales by payment method
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount
FROM pos_transactions 
WHERE DATE(created_at) = CURDATE() AND status = 'completed'
GROUP BY payment_method;
*/ 