-- ============================================================
-- HỆ THỐNG QUẢN LÝ THU PHÍ CHUNG CƯ BLUEMOON v1.0
-- Database: bluemoon_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS bluemoon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bluemoon_db;

-- 1. Bảng Người dùng & Phân quyền (RBAC - UC001, UC016)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_RESIDENT_MANAGER') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_username (username)
);

-- 2. Bảng Căn hộ (UC003)
CREATE TABLE IF NOT EXISTS apartments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL UNIQUE, -- Đánh chỉ mục Index phục vụ UC010 tra cứu < 3s
    floor INT NOT NULL,
    area DOUBLE NOT NULL CHECK (area > 0),
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(15) NOT NULL,
    status ENUM('EMPTY', 'OCCUPIED') DEFAULT 'OCCUPIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_apartment_code (apartment_code)
);

-- 3. Bảng Nhân khẩu (UC004, UC005)
CREATE TABLE IF NOT EXISTS residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Nam', 'Nữ', 'Khác') NOT NULL,
    cccd_number CHAR(12) UNIQUE, -- Chặn trùng CCCD trên toàn tòa nhà
    relationship_with_owner VARCHAR(50) NOT NULL,
    residence_status ENUM('THUONG_TRU', 'TAM_TRU', 'TAM_VANG') DEFAULT 'THUONG_TRU',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_resident_cccd (cccd_number)
);

-- 4. Bảng Nhật ký biến động cư trú (UC005, UC006)
CREATE TABLE IF NOT EXISTS residency_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    log_type ENUM('TAM_TRU', 'TAM_VANG') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
);

-- 5. Bảng Biểu phí & Khoản thu (UC007, UC008)
CREATE TABLE IF NOT EXISTS fee_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(100) NOT NULL,
    fee_type ENUM('SERVICE', 'MANAGEMENT', 'VOLUNTARY') NOT NULL,
    unit_price DOUBLE NOT NULL DEFAULT 0, -- Phí DV: 2.500 - 16.500, Phí QL: 7.000, Tự nguyện: 0
    is_mandatory TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Hóa đơn Công nợ tháng (UC009, UC010 - Đảm bảo Idempotent)
CREATE TABLE IF NOT EXISTS debt_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL, -- Định dạng: 'YYYY-MM' (VD: '2026-11')
    service_fee DOUBLE NOT NULL DEFAULT 0,
    management_fee DOUBLE NOT NULL DEFAULT 0,
    old_debt DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL DEFAULT 0,
    status ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN') DEFAULT 'CHUA_THANH_TOAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Khóa UNIQUE chặn tính chất chốt nợ trùng lặp (Idempotent)
    UNIQUE KEY uq_apartment_month (apartment_id, billing_month),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_invoice_status_month (status, billing_month)
);

-- 7. Bảng Phiếu thu / Biên lai (UC011, UC012, UC013)
CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_code VARCHAR(30) NOT NULL UNIQUE,
    apartment_id INT NOT NULL,
    cashier_id INT NOT NULL,
    total_paid DOUBLE NOT NULL,
    voluntary_fee DOUBLE DEFAULT 0,
    payment_method ENUM('TIEN_MAT', 'CHUYEN_KHOAN') NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('VALID', 'CANCELLED') DEFAULT 'VALID',
    cancel_reason TEXT NULL,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- 8. Bảng Nhật ký kiểm toán (Audit Log - NFR 4.1 & UC013, UC016)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    record_id INT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- ============================================================
-- Mật khẩu mặc định: Admin@2026 (Đã băm BCrypt)
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('admin', '$2a$10$wK1k6pY7B71kY8O1G/1.i.X6Kqv7fHqO79W68b3zGz3y5rF/G7z5K', 'Ban Quản Trị BlueMoon', 'ROLE_ADMIN'),
('thungan_01', '$2a$10$wK1k6pY7B71kY8O1G/1.i.X6Kqv7fHqO79W68b3zGz3y5rF/G7z5K', 'Nguyễn Thu Ngân', 'ROLE_CASHIER'),
('canbo_cudan', '$2a$10$wK1k6pY7B71kY8O1G/1.i.X6Kqv7fHqO79W68b3zGz3y5rF/G7z5K', 'Trần Quản Lý Cư Dân', 'ROLE_RESIDENT_MANAGER');

-- Cấu hình phí mặc định theo SRS
INSERT INTO fee_configs (fee_name, fee_type, unit_price, is_mandatory) VALUES
('Phí dịch vụ chung cư', 'SERVICE', 12000, 1),
('Phí quản lý vận hành', 'MANAGEMENT', 7000, 1),
('Quỹ vì người nghèo', 'VOLUNTARY', 0, 0),
('Quỹ Tết thiếu nhi', 'VOLUNTARY', 0, 0);