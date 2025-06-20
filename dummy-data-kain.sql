-- Data Dummy untuk Aplikasi Stok Kain
-- Jalankan setelah database.sql sudah diimport

-- Hapus data sample lama dan insert data baru
DELETE FROM stock_logs;
DELETE FROM items;
DELETE FROM categories;
DELETE FROM locations;

-- Reset auto increment
ALTER TABLE stock_logs AUTO_INCREMENT = 1;
ALTER TABLE items AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE locations AUTO_INCREMENT = 1;

-- Insert Categories untuk Kain
INSERT INTO categories (name, description) VALUES 
('Katun', 'Kain katun alami dan campuran katun'),
('Polyester', 'Kain sintetis polyester dan blending'),
('Sutra', 'Kain sutra alami dan sutra sintetis'),
('Linen', 'Kain linen dan rami'),
('Denim', 'Kain denim dan jeans'),
('Wool', 'Kain wool dan bahan hangat'),
('Chiffon', 'Kain chiffon dan bahan tipis'),
('Satin', 'Kain satin dan bahan mengkilap'),
('Jersey', 'Kain jersey dan kaos'),
('Batik', 'Kain batik dan motif tradisional');

-- Insert Locations untuk Gudang Kain
INSERT INTO locations (name, description) VALUES 
('Gudang A1', 'Gudang utama untuk kain katun dan linen'),
('Gudang A2', 'Gudang untuk kain sintetis dan polyester'),
('Gudang B1', 'Gudang kain premium (sutra, wool, satin)'),
('Gudang B2', 'Gudang kain casual (jersey, denim)'),
('Gudang C', 'Gudang kain motif dan batik'),
('Showroom', 'Area display dan sample kain'),
('Quality Control', 'Area inspeksi dan kontrol kualitas'),
('Cutting Room', 'Ruang potong dan persiapan'),
('Storage Dingin', 'Penyimpanan khusus kain sensitif'),
('Ekspor Area', 'Area persiapan kain untuk ekspor');

-- Insert Items Kain dengan Data Realistis
INSERT INTO items (code, name, description, category_id, location_id, quantity, unit, price, min_stock, max_stock) VALUES 

-- Katun
('KTN001', 'Katun Combed 30s', 'Kain katun combed halus, cocok untuk kemeja dan blouse', 1, 1, 150, 'Meter', 25000, 30, 500),
('KTN002', 'Katun Canvas', 'Kain katun canvas tebal untuk tas dan sepatu', 1, 1, 80, 'Meter', 35000, 20, 300),
('KTN003', 'Katun Drill', 'Kain katun drill untuk seragam kerja', 1, 1, 200, 'Meter', 28000, 40, 600),
('KTN004', 'Katun Voile', 'Kain katun voile tipis untuk kerudung dan tunik', 1, 1, 120, 'Meter', 22000, 25, 400),
('KTN005', 'Katun Linen Look', 'Kain katun dengan tekstur seperti linen', 1, 1, 90, 'Meter', 32000, 20, 300),

-- Polyester
('PLY001', 'Polyester Satin', 'Kain polyester satin untuk dress dan blouse', 2, 2, 180, 'Meter', 18000, 35, 500),
('PLY002', 'Polyester Crepe', 'Kain polyester crepe tidak mudah kusut', 2, 2, 220, 'Meter', 24000, 45, 600),
('PLY003', 'Polyester Spandex', 'Kain polyester stretch untuk olahraga', 2, 2, 160, 'Meter', 30000, 30, 400),
('PLY004', 'Polyester Chiffon', 'Kain polyester chiffon transparan', 2, 2, 75, 'Meter', 20000, 15, 250),
('PLY005', 'Polyester Gabardine', 'Kain polyester gabardine untuk celana formal', 2, 2, 95, 'Meter', 26000, 20, 300),

-- Sutra
('SLK001', 'Sutra Organza', 'Kain sutra organza premium untuk gaun pesta', 3, 3, 45, 'Meter', 85000, 10, 150),
('SLK002', 'Sutra Dupioni', 'Kain sutra dupioni dengan tekstur khas', 3, 3, 35, 'Meter', 95000, 8, 120),
('SLK003', 'Sutra Satin', 'Kain sutra satin mewah dan mengkilap', 3, 3, 28, 'Meter', 120000, 5, 100),
('SLK004', 'Sutra Crepe de Chine', 'Kain sutra halus untuk scarf dan blouse', 3, 3, 40, 'Meter', 75000, 8, 130),

-- Linen
('LNN001', 'Linen Murni', 'Kain linen 100% alami untuk kemeja kasual', 4, 1, 85, 'Meter', 45000, 15, 250),
('LNN002', 'Linen Cotton', 'Campuran linen dan katun yang nyaman', 4, 1, 110, 'Meter', 38000, 20, 300),
('LNN003', 'Linen Viscose', 'Linen blending dengan viscose', 4, 1, 95, 'Meter', 42000, 18, 280),

-- Denim
('DNM001', 'Denim 14 Oz', 'Kain denim tebal untuk jeans premium', 5, 4, 125, 'Meter', 55000, 25, 400),
('DNM002', 'Denim Stretch', 'Kain denim dengan elastane untuk kenyamanan', 5, 4, 140, 'Meter', 48000, 30, 450),
('DNM003', 'Denim Chambray', 'Kain denim tipis untuk kemeja', 5, 4, 90, 'Meter', 35000, 20, 300),

-- Wool
('WOL001', 'Wool Cashmere', 'Kain wool cashmere premium untuk coat', 6, 3, 25, 'Meter', 180000, 5, 80),
('WOL002', 'Wool Flannel', 'Kain wool flannel untuk kemeja formal', 6, 3, 35, 'Meter', 95000, 8, 120),
('WOL003', 'Wool Crepe', 'Kain wool crepe untuk blazer dan dress', 6, 3, 30, 'Meter', 125000, 6, 100),

-- Chiffon
('CHF001', 'Chiffon Silk', 'Kain chiffon sutra untuk gaun pesta', 7, 3, 60, 'Meter', 65000, 12, 200),
('CHF002', 'Chiffon Polyester', 'Kain chiffon polyester ringan', 7, 2, 85, 'Meter', 28000, 18, 280),

-- Satin
('STN001', 'Satin Duchess', 'Kain satin duchess tebal untuk gaun pengantin', 8, 3, 40, 'Meter', 78000, 8, 150),
('STN002', 'Satin Charmeuse', 'Kain satin charmeuse halus dan jatuh', 8, 3, 55, 'Meter', 58000, 12, 180),

-- Jersey
('JRS001', 'Jersey Cotton', 'Kain jersey katun untuk kaos', 9, 4, 200, 'Meter', 18000, 40, 600),
('JRS002', 'Jersey Viscose', 'Kain jersey viscose jatuh dan nyaman', 9, 4, 150, 'Meter', 22000, 30, 450),
('JRS003', 'Jersey Modal', 'Kain jersey modal premium anti pilling', 9, 4, 100, 'Meter', 35000, 20, 300),

-- Batik
('BTK001', 'Batik Cap Jogja', 'Kain batik cap motif Jogja tradisional', 10, 5, 80, 'Meter', 45000, 15, 250),
('BTK002', 'Batik Tulis Solo', 'Kain batik tulis halus dari Solo', 10, 5, 35, 'Meter', 125000, 8, 120),
('BTK003', 'Batik Printing Modern', 'Kain batik printing motif kontemporer', 10, 5, 120, 'Meter', 28000, 25, 400),
('BTK004', 'Batik Kombinasi', 'Kain batik kombinasi cap dan tulis', 10, 5, 50, 'Meter', 75000, 10, 180);

-- Insert beberapa sample stock logs untuk testing
INSERT INTO stock_logs (item_id, user_id, type, quantity, previous_stock, current_stock, notes, reference_no, transaction_date) VALUES 
(1, 1, 'in', 50, 100, 150, 'Restok kain katun combed dari supplier PT Tekstil Jaya', 'PO-2024-001', '2024-01-15 09:30:00'),
(2, 1, 'out', 15, 95, 80, 'Pengambilan untuk order customer CV Busana Indah', 'SO-2024-005', '2024-01-16 14:20:00'),
(5, 1, 'in', 40, 50, 90, 'Tambahan stok katun linen look untuk promosi', 'PO-2024-002', '2024-01-17 11:45:00'),
(8, 1, 'out', 20, 180, 160, 'Order khusus untuk butik premium Jakarta', 'SO-2024-008', '2024-01-18 16:10:00'),
(12, 1, 'in', 15, 20, 35, 'Import sutra dupioni dari Thailand', 'IMP-2024-001', '2024-01-19 08:15:00'),
(15, 1, 'out', 10, 95, 85, 'Sample untuk fashion week Jakarta', 'SAMPLE-001', '2024-01-20 13:30:00'),
(20, 1, 'in', 25, 115, 140, 'Restok denim stretch dari supplier lokal', 'PO-2024-003', '2024-01-21 10:00:00'),
(25, 1, 'out', 8, 33, 25, 'Order wool cashmere untuk koleksi winter', 'SO-2024-012', '2024-01-22 15:45:00');

-- Update beberapa items agar ada yang stok menipis untuk testing alert
UPDATE items SET quantity = 5 WHERE code IN ('SLK003', 'WOL001');
UPDATE items SET quantity = 8 WHERE code IN ('SLK002', 'WOL002', 'BTK002');
UPDATE items SET quantity = 12 WHERE code IN ('CHF001', 'STN002');

SELECT 'Data dummy kain berhasil diinsert!' as status; 