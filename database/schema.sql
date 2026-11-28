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

-- ============================================================
-- SPRINT 2: TÀI CHÍNH CỐT LÕI & TIỆN ÍCH ĐIỆN/NƯỚC/INTERNET
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(100) NOT NULL UNIQUE,
    fee_type VARCHAR(20) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    unit VARCHAR(20) NOT NULL,
    description VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fee_items_type_active (fee_type, is_active, is_deleted)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS utility_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    billing_period VARCHAR(7) NOT NULL,
    service_type VARCHAR(20) NOT NULL,
    old_index DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    new_index DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    usage_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_utility_household FOREIGN KEY (household_id) REFERENCES households(id),
    UNIQUE KEY uq_utility_household_period_type (household_id, billing_period, service_type),
    INDEX idx_utility_period_type (billing_period, service_type),
    INDEX idx_utility_household_period (household_id, billing_period)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_name VARCHAR(120) NOT NULL,
    billing_period VARCHAR(7) NOT NULL UNIQUE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    closed_at DATETIME NULL,
    created_by INT NOT NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_billing_cycle_creator FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_billing_cycle_status (status, billing_period)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_code VARCHAR(32) NOT NULL UNIQUE,
    billing_cycle_id INT NOT NULL,
    household_id INT NOT NULL,
    billing_period VARCHAR(7) NOT NULL,
    service_fee_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    utility_fee_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    payment_method VARCHAR(20) NULL,
    paid_at DATETIME NULL,
    collected_by INT NULL,
    note VARCHAR(500) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id),
    CONSTRAINT fk_invoice_household FOREIGN KEY (household_id) REFERENCES households(id),
    CONSTRAINT fk_invoice_collector FOREIGN KEY (collected_by) REFERENCES users(id),
    UNIQUE KEY uq_invoice_household_period (household_id, billing_period),
    INDEX idx_invoice_status_period (status, billing_period),
    INDEX idx_invoice_household_status (household_id, status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_items_invoice (invoice_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO fee_items (fee_name, fee_type, unit_price, unit, description, is_active, is_deleted)
VALUES
('Phí dịch vụ chung cư', 'MANDATORY', 12000.00, 'M2', 'Phí dịch vụ chung cư tính theo diện tích căn hộ', 1, 0),
('Phí quản lý vận hành', 'MANDATORY', 7000.00, 'M2', 'Phí quản lý vận hành tòa nhà theo m²', 1, 0),
('Phí vệ sinh môi trường', 'MANDATORY', 6000.00, 'PERSON', 'Phí vệ sinh tính theo số nhân khẩu đang cư trú', 1, 0),
('Quỹ vì người nghèo', 'VOLUNTARY', 0.00, 'HOUSEHOLD', 'Khoản đóng góp tự nguyện vì cộng đồng', 1, 0),
('Quỹ Tết thiếu nhi', 'VOLUNTARY', 0.00, 'HOUSEHOLD', 'Khoản đóng góp tự nguyện cho thiếu nhi tòa nhà', 1, 0)
ON DUPLICATE KEY UPDATE id = id;
