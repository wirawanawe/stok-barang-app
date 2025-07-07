-- Add images column to items table for multiple image support
ALTER TABLE items ADD COLUMN images TEXT DEFAULT NULL;

-- Update existing items to have empty images array
UPDATE items SET images = '[]' WHERE images IS NULL;

-- Add comment for the new column
ALTER TABLE items MODIFY COLUMN images TEXT COMMENT 'JSON array of image URLs for the item'; 