-- Script untuk menambahkan tabel user_sessions ke database yang sudah ada
-- Jalankan script ini jika database sudah dibuat sebelumnya

USE stok_barang;

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

-- Cleanup procedure untuk menghapus session yang sudah expired
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupExpiredSessions()
BEGIN
    UPDATE user_sessions 
    SET is_active = false 
    WHERE expires_at <= NOW() AND is_active = true;
END//
DELIMITER ;

-- Event scheduler untuk membersihkan session expired secara otomatis (setiap 1 jam)
-- Uncomment jika ingin mengaktifkan auto-cleanup
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_sessions
-- ON SCHEDULE EVERY 1 HOUR
-- DO
--   CALL CleanupExpiredSessions(); 