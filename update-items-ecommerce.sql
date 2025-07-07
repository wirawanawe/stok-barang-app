-- Update items table for e-commerce functionality
-- Run this after ensuring items table exists

-- Check if columns exist before adding them
PRAGMA table_info(items);

-- Add e-commerce columns to items table
ALTER TABLE items ADD COLUMN online_price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE items ADD COLUMN is_available_online BOOLEAN DEFAULT 1;
ALTER TABLE items ADD COLUMN min_order_qty INTEGER DEFAULT 1;

-- Update some items with online pricing (only if items exist)
UPDATE items SET 
    online_price = CASE 
        WHEN price > 0 THEN price * 1.1  -- Add 10% markup for online sales
        ELSE 50000  -- Default price if no price set
    END,
    is_available_online = 1,
    min_order_qty = 1
WHERE id <= 10;  -- Update first 10 items 