-- =====================================================================
-- FILE: database/migrations/V2__add_password_management.sql
-- Mục đích: Phục vụ US-014 (Đăng nhập, Quản lý & Đổi mật khẩu định kỳ)
-- =====================================================================

-- 1. Bảng users và hai cột quản lý mật khẩu được tạo trong schema.sql.
-- Phải chạy schema.sql trước migration này.

-- 2. Tạo bảng lưu lịch sử mật khẩu (chặn người dùng đổi lại mật khẩu cũ vừa dùng)
CREATE TABLE IF NOT EXISTS password_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pwd_history_user_id (user_id)
);

-- 3. Tạo dữ liệu mẫu (Seed Data) với mật khẩu "BlueMoon@2026" đã băm bằng BCrypt
-- Chuỗi hash dưới đây tương ứng với plaintext: BlueMoon@2026
INSERT INTO users (username, password_hash, full_name, role, is_active, is_deleted, password_changed_at, force_password_change)
VALUES 
-- Tài khoản Admin còn hạn mật khẩu
('admin_01', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Hoàng Phúc Hưng', 'ROLE_ADMIN', 1, 0, NOW(), 0),
-- Tài khoản Thu ngân đã quá hạn 95 ngày (để test cảnh báo đổi mật khẩu định kỳ 90 ngày)
('thungan_01', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Nguyễn Thu Ngân', 'ROLE_CASHIER', 1, 0, DATE_SUB(NOW(), INTERVAL 95 DAY), 0),
-- Tài khoản bị khóa (để test luồng 5a trong SRS)
('locked_user', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Nhân Viên Cũ', 'ROLE_RESIDENT_MANAGER', 0, 0, NOW(), 0)
ON DUPLICATE KEY UPDATE id = id;

UPDATE users
SET password_hash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a',
    is_active = 1,
    is_deleted = 0,
    password_changed_at = NOW(),
    force_password_change = 0
WHERE username = 'admin_01';
