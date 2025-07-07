-- Script untuk memperbaiki masalah session login/logout
-- Masalah: UNIQUE constraint pada user_id mencegah login kembali setelah logout

USE stok_barang;

-- 1. Hapus constraint unique yang bermasalah
ALTER TABLE user_sessions DROP INDEX unique_user_session;

-- 2. Bersihkan session yang expired atau tidak aktif
UPDATE user_sessions 
SET is_active = false 
WHERE expires_at <= NOW() OR is_active = false;

-- 3. Hapus session lama yang sudah tidak aktif untuk membersihkan data
-- (opsional - hanya jika ingin cleanup data lama)
-- DELETE FROM user_sessions WHERE is_active = false AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 4. Verifikasi perubahan
SHOW INDEXES FROM user_sessions;

SELECT 'Session constraint telah diperbaiki!' as status;
SELECT COUNT(*) as total_sessions FROM user_sessions;
SELECT COUNT(*) as active_sessions FROM user_sessions WHERE is_active = true; 