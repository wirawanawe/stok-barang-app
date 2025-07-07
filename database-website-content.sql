-- Tabel untuk mengelola konten website
USE stok_barang;

-- Tabel Website Settings
CREATE TABLE website_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('text', 'textarea', 'image', 'url') DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel News/Articles untuk berita tekstil
CREATE TABLE news_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(255),
  category ENUM('textile', 'fashion', 'industry', 'trends', 'technology') DEFAULT 'textile',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  author_id INT,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_published (published_at)
);

-- Insert default website settings
INSERT INTO website_settings (setting_key, setting_value, setting_type, description) VALUES
('site_title', 'StokKain - Sistem Manajemen Stok Kain', 'text', 'Judul website'),
('site_description', 'Sistem manajemen stok kain modern untuk bisnis tekstil Anda', 'textarea', 'Deskripsi website'),
('contact_email', 'info@stokkain.com', 'email', 'Email kontak'),
('contact_phone', '+62 123 456 789', 'text', 'Nomor telepon kontak'),
('contact_address', 'Jl. Tekstil No. 123, Jakarta', 'textarea', 'Alamat kontak'),
('about_us', 'Kami adalah perusahaan yang bergerak di bidang sistem manajemen stok kain modern.', 'textarea', 'Tentang kami'),
('site_logo', '', 'text', 'URL logo website'),
('slider_image_1', '', 'text', 'Gambar slider 1'),
('slider_title_1', 'Selamat Datang di Sistem Stok Kain Modern', 'text', 'Judul slider 1'),
('slider_subtitle_1', 'Pelopor Manajemen Stok Kain Terdepan di Indonesia', 'text', 'Subjudul slider 1'),
('slider_description_1', 'Kelola stok kain Anda dengan mudah dan efisien menggunakan sistem terdepan', 'textarea', 'Deskripsi slider 1'),
('slider_cta_1', 'Mulai Kelola Stok', 'text', 'Tombol CTA slider 1'),
('slider_image_2', '', 'text', 'Gambar slider 2'),
('slider_title_2', 'Manajemen Stok yang Efisien', 'text', 'Judul slider 2'),
('slider_subtitle_2', 'Teknologi Canggih untuk Bisnis Tekstil Anda', 'text', 'Subjudul slider 2'),
('slider_description_2', 'Pantau stok real-time, kelola transaksi, dan buat laporan dengan mudah', 'textarea', 'Deskripsi slider 2'),
('slider_cta_2', 'Pelajari Fitur', 'text', 'Tombol CTA slider 2'),
('slider_image_3', '', 'text', 'Gambar slider 3'),
('slider_title_3', 'Solusi Terpadu untuk Bisnis Kain', 'text', 'Judul slider 3'),
('slider_subtitle_3', 'Dari Stok Hingga Laporan dalam Satu Platform', 'text', 'Subjudul slider 3'),
('slider_description_3', 'Integrasikan semua kebutuhan manajemen stok kain dalam satu sistem', 'textarea', 'Deskripsi slider 3'),
('slider_cta_3', 'Lihat Demo', 'text', 'Tombol CTA slider 3');

-- Insert sample news articles
INSERT INTO news_articles (title, slug, content, excerpt, category, status, author_id, published_at) VALUES
('Tren Kain Ramah Lingkungan 2024', 'tren-kain-ramah-lingkungan-2024', 
'Industri tekstil semakin bergerak menuju praktik yang lebih berkelanjutan. Kain organik dan ramah lingkungan menjadi pilihan utama konsumen modern yang peduli lingkungan. 

Beberapa jenis kain ramah lingkungan yang populer:
- Kain organic cotton
- Kain bambu
- Kain tencel
- Kain linen organik

Tren ini diprediksi akan terus berkembang sepanjang tahun 2024 dengan inovasi teknologi yang semakin canggih.', 
'Kain ramah lingkungan menjadi tren utama di industri tekstil 2024. Simak berbagai pilihan kain organik yang tersedia.', 
'trends', 'published', 1, NOW()),

('Teknologi Terbaru dalam Produksi Tekstil', 'teknologi-terbaru-produksi-tekstil',
'Perkembangan teknologi dalam industri tekstil membawa revolusi besar dalam cara produksi kain. Dari teknologi 3D printing hingga smart textiles, inovasi terus bermunculan.

Teknologi terdepan meliputi:
- 3D Knitting Technology
- Smart Textiles dengan sensor
- Sustainable dyeing process
- AI-powered quality control

Teknologi ini tidak hanya meningkatkan efisiensi produksi tetapi juga kualitas produk akhir.', 
'Teknologi terbaru mengubah cara produksi tekstil dengan inovasi yang lebih efisien dan berkelanjutan.', 
'technology', 'published', 1, NOW()),

('Panduan Memilih Kain untuk Fashion Sustainable', 'panduan-memilih-kain-fashion-sustainable',
'Fashion sustainable bukan hanya tren, tetapi kebutuhan untuk masa depan yang lebih baik. Memilih kain yang tepat adalah langkah pertama dalam menciptakan fashion berkelanjutan.

Tips memilih kain sustainable:
1. Pilih kain dengan sertifikasi organik
2. Perhatikan proses pewarnaan yang ramah lingkungan
3. Pilih kain yang tahan lama
4. Pertimbangkan asal-usul bahan baku

Dengan memilih kain yang tepat, kita turut berkontribusi pada lingkungan yang lebih sehat.', 
'Panduan lengkap memilih kain untuk fashion sustainable yang ramah lingkungan dan berkualitas tinggi.', 
'fashion', 'published', 1, NOW()); 