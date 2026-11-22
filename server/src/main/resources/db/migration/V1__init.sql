-- BlueMoon initial schema and demo data.
-- Database creation and USE statements are intentionally omitted:
-- Flyway runs against the database configured by spring.datasource.url.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_RESIDENT_MANAGER') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    force_password_change TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_username (username)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS apartments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_code VARCHAR(20) NOT NULL UNIQUE,
    floor INT NOT NULL,
    area DOUBLE NOT NULL CHECK (area > 0),
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(15) NOT NULL,
    status ENUM('EMPTY', 'OCCUPIED') DEFAULT 'OCCUPIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_apartment_code (apartment_code)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Nam', 'Nữ', 'Khác') NOT NULL,
    cccd_number CHAR(12) UNIQUE,
    relationship_with_owner VARCHAR(50) NOT NULL,
    residence_status ENUM('THUONG_TRU', 'TAM_TRU', 'TAM_VANG') DEFAULT 'THUONG_TRU',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_resident_cccd (cccd_number)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS residency_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    log_type ENUM('TAM_TRU', 'TAM_VANG') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fee_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(100) NOT NULL,
    fee_type ENUM('SERVICE', 'MANAGEMENT', 'VOLUNTARY') NOT NULL,
    unit_price DOUBLE NOT NULL DEFAULT 0,
    is_mandatory TINYINT(1) DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debt_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL,
    service_fee DOUBLE NOT NULL DEFAULT 0,
    management_fee DOUBLE NOT NULL DEFAULT 0,
    old_debt DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL DEFAULT 0,
    status ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN') DEFAULT 'CHUA_THANH_TOAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_apartment_month (apartment_id, billing_month),
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_invoice_status_month (status, billing_month)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- All demo passwords are BCrypt hashes for BlueMoon@2026.
INSERT INTO users (
    username, password_hash, full_name, role, is_active, is_deleted,
    password_changed_at, force_password_change
) VALUES
('admin_01', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Hoàng Phúc Hưng', 'ROLE_ADMIN', 1, 0, CURRENT_TIMESTAMP, 0),
('thungan_01', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Nguyễn Thu Ngân', 'ROLE_CASHIER', 1, 0,
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 95 DAY), 0),
('canbo_cudan', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Trần Quản Lý Cư Dân', 'ROLE_RESIDENT_MANAGER', 1, 0, CURRENT_TIMESTAMP, 0),
('locked_user', '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Nhân Viên Cũ', 'ROLE_RESIDENT_MANAGER', 0, 0, CURRENT_TIMESTAMP, 0)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO fee_configs (fee_name, fee_type, unit_price, is_mandatory)
VALUES
('Phí dịch vụ chung cư', 'SERVICE', 12000, 1),
('Phí quản lý vận hành', 'MANAGEMENT', 7000, 1),
('Quỹ vì người nghèo', 'VOLUNTARY', 0, 0),
('Quỹ Tết thiếu nhi', 'VOLUNTARY', 0, 0)
ON DUPLICATE KEY UPDATE id = id;
