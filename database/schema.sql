-- ============================================================
-- HỆ THỐNG QUẢN LÝ CHUNG CƯ BLUEMOON — WEB SERVER v1.0
-- Đồng bộ kiến trúc agile_plan.md (Sprint 1: PB-001 -> PB-005)
-- ============================================================

CREATE DATABASE IF NOT EXISTS bluemoon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bluemoon_db;

-- 1. Bảng Căn hộ (PB-003)
CREATE TABLE IF NOT EXISTS apartments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL UNIQUE,
    floor INT NOT NULL,
    area DOUBLE NOT NULL CHECK (area > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE / OCCUPIED
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_apartment_code (apartment_code),
    INDEX idx_apartment_status (status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Bảng Hộ gia đình (PB-004: Move-in / Move-out)
CREATE TABLE IF NOT EXISTS households (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    head_cccd VARCHAR(12) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / MOVED_OUT
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_household_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    INDEX idx_household_apartment_status (apartment_id, status),
    INDEX idx_household_head_cccd (head_cccd)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Bảng Người dùng & Phân quyền RBAC (PB-002: ADMIN / RESIDENT)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NULL UNIQUE,
    phone VARCHAR(15) NULL,
    role VARCHAR(30) NOT NULL, -- ADMIN / RESIDENT
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED', -- PENDING / APPROVED / REJECTED
    email_verified TINYINT(1) NOT NULL DEFAULT 1,
    household_id INT NULL,
    password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    force_password_change TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL,
    INDEX idx_user_username (username)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Bảng Lịch sử mật khẩu
CREATE TABLE IF NOT EXISTS password_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pwd_history_user_id (user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Bảng OTP Email (PB-002: lưu dạng băm BCrypt, TTL 5 phút)
CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    purpose VARCHAR(30) NOT NULL, -- REGISTER / RESET_PASSWORD
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_otp_lookup (email, purpose, used)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Bảng Nhân khẩu (PB-005: gắn household_id, CCCD 9|12 số, THUONG_TRU / TAM_TRU)
CREATE TABLE IF NOT EXISTS residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NULL,
    apartment_id INT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    cccd_number VARCHAR(12) UNIQUE,
    relationship_with_owner VARCHAR(50) NOT NULL,
    residence_status VARCHAR(20) NOT NULL DEFAULT 'THUONG_TRU', -- THUONG_TRU / TAM_TRU
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resident_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_resident_cccd (cccd_number),
    INDEX idx_resident_household (household_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Bảng Nhật ký kiểm toán (Audit Log - PB-001)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    record_id INT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- Mật khẩu mặc định: BlueMoon@2026 (BCrypt)
-- ============================================================
INSERT INTO users (
    username, password_hash, full_name, email, phone, role,
    is_active, is_deleted, approval_status, email_verified,
    password_changed_at, force_password_change
) VALUES
('admin_01', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Hoàng Phúc Hưng', 'admin@bluemoon.vn', '0901000001', 'ADMIN', 1, 0, 'APPROVED', 1, CURRENT_TIMESTAMP, 0),
('resident_01', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Nguyễn Văn Cư Dân', 'resident@bluemoon.vn', '0912345678', 'RESIDENT', 1, 0, 'APPROVED', 1, CURRENT_TIMESTAMP, 0)
ON DUPLICATE KEY UPDATE id = id;
