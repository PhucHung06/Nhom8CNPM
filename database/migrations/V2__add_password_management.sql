-- =====================================================================
-- FILE: database/migrations/V2__add_password_management.sql
-- Mục đích: Phục vụ US-014 (Đăng nhập, Quản lý & Đổi mật khẩu định kỳ)
-- =====================================================================

-- 1. Bảng users và hai cột quản lý mật khẩu được tạo trong schema.sql.
-- Phải chạy schema.sql trước migration này.

-- 2. Tạo bảng lưu lịch sử mật khẩu để chặn dùng lại 3 mật khẩu gần nhất.
CREATE TABLE IF NOT EXISTS password_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pwd_history_user_id (user_id)
);
