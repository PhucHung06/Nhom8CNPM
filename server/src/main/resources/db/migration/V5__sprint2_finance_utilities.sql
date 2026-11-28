-- ============================================================
-- SPRINT 2: TÀI CHÍNH CỐT LÕI & TIỆN ÍCH ĐIỆN/NƯỚC/INTERNET
-- (PB-006, PB-007, PB-008, PB-009)
-- ============================================================

-- 1. Danh mục khoản thu (PB-006)
CREATE TABLE IF NOT EXISTS fee_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(100) NOT NULL UNIQUE,
    fee_type VARCHAR(20) NOT NULL, -- MANDATORY / VOLUNTARY
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    unit VARCHAR(20) NOT NULL, -- M2 / PERSON / HOUSEHOLD
    description VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fee_items_type_active (fee_type, is_active, is_deleted)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Chỉ số Điện / Nước / Internet theo kỳ (PB-007)
CREATE TABLE IF NOT EXISTS utility_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    household_id INT NOT NULL,
    billing_period VARCHAR(7) NOT NULL, -- YYYY-MM
    service_type VARCHAR(20) NOT NULL, -- ELECTRICITY / WATER / INTERNET
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

-- 3. Đợt thu định kỳ (PB-008)
CREATE TABLE IF NOT EXISTS billing_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_name VARCHAR(120) NOT NULL,
    billing_period VARCHAR(7) NOT NULL UNIQUE, -- YYYY-MM
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN / CLOSED
    closed_at DATETIME NULL,
    created_by INT NOT NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_billing_cycle_creator FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_billing_cycle_status (status, billing_period)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Hóa đơn công nợ hộ gia đình (PB-008, PB-009)
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_code VARCHAR(32) NOT NULL UNIQUE,
    billing_cycle_id INT NOT NULL,
    household_id INT NOT NULL,
    billing_period VARCHAR(7) NOT NULL,
    service_fee_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    utility_fee_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- UNPAID / PAID
    payment_method VARCHAR(20) NULL, -- CASH / VNPAY
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

-- 5. Chi tiết các khoản trong hóa đơn (PB-008, PB-009)
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- FEE / UTILITY
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(30) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_items_invoice (invoice_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed dữ liệu khoản thu mặc định
INSERT INTO fee_items (fee_name, fee_type, unit_price, unit, description, is_active, is_deleted)
VALUES
('Phí dịch vụ chung cư', 'MANDATORY', 12000.00, 'M2', 'Phí dịch vụ chung cư tính theo diện tích căn hộ', 1, 0),
('Phí quản lý vận hành', 'MANDATORY', 7000.00, 'M2', 'Phí quản lý vận hành tòa nhà theo m²', 1, 0),
('Phí vệ sinh môi trường', 'MANDATORY', 6000.00, 'PERSON', 'Phí vệ sinh tính theo số nhân khẩu đang cư trú', 1, 0),
('Quỹ vì người nghèo', 'VOLUNTARY', 0.00, 'HOUSEHOLD', 'Khoản đóng góp tự nguyện vì cộng đồng', 1, 0),
('Quỹ Tết thiếu nhi', 'VOLUNTARY', 0.00, 'HOUSEHOLD', 'Khoản đóng góp tự nguyện cho thiếu nhi tòa nhà', 1, 0)
ON DUPLICATE KEY UPDATE id = id;
