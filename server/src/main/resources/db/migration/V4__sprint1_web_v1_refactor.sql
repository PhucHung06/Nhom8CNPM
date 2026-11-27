-- ============================================================
-- V4: Refactor Sprint 1 theo kiến trúc Web Server v1.0 (agile_plan.md)
-- Tương thích MySQL 8.0+ (Local & Aiven Cloud) - Không dùng USE <db>
-- ============================================================

-- 1. Tạo bảng Hộ gia đình (PB-004: Move-in / Move-out)
CREATE TABLE IF NOT EXISTS households (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    head_cccd VARCHAR(12) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_household_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    INDEX idx_household_apartment_status (apartment_id, status),
    INDEX idx_household_head_cccd (head_cccd)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Tạo bảng OTP Email (PB-002: lưu dạng băm BCrypt, TTL 5 phút)
CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_otp_lookup (email, purpose, used)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Chuẩn hóa bảng apartments (PB-003: AVAILABLE / OCCUPIED, Soft Delete)
ALTER TABLE apartments
    ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';

UPDATE apartments SET status = 'AVAILABLE' WHERE status = 'EMPTY';

-- Di chuyển dữ liệu hộ đang ở từ bảng apartments cũ sang households
INSERT INTO households (apartment_id, head_name, head_cccd, phone, move_in_date, status, is_deleted)
SELECT
    id,
    owner_name,
    COALESCE(NULLIF(TRIM(owner_cccd), ''), '000000000000'),
    owner_phone,
    COALESCE(DATE(created_at), CURRENT_DATE),
    'ACTIVE',
    0
FROM apartments
WHERE status = 'OCCUPIED'
  AND owner_name IS NOT NULL
  AND TRIM(owner_name) <> '';

DROP INDEX idx_apartment_owner_name ON apartments;

ALTER TABLE apartments
    DROP COLUMN owner_name,
    DROP COLUMN owner_cccd,
    DROP COLUMN owner_phone;

-- 4. Chuẩn hóa bảng users (PB-002: RBAC ADMIN / RESIDENT, Duyệt & Grant-access)
ALTER TABLE users
    MODIFY COLUMN role VARCHAR(30) NOT NULL,
    ADD COLUMN email VARCHAR(120) NULL UNIQUE AFTER full_name,
    ADD COLUMN phone VARCHAR(15) NULL AFTER email,
    ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' AFTER is_deleted,
    ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1 AFTER approval_status,
    ADD COLUMN household_id INT NULL AFTER email_verified,
    ADD CONSTRAINT fk_user_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL;

UPDATE users SET role = 'RESIDENT' WHERE username = 'locked_user';
UPDATE users SET role = 'ADMIN' WHERE role IN ('ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_RESIDENT_MANAGER');
UPDATE users SET email = 'admin@bluemoon.vn' WHERE username = 'admin_01' AND email IS NULL;

INSERT INTO users (
    username, password_hash, full_name, email, phone, role,
    is_active, is_deleted, approval_status, email_verified,
    password_changed_at, force_password_change
) VALUES (
    'resident_01',
    '$2a$10$BT.Ega74/t0itOyy65MjPOKD0bjXaIrwM631n.nfiGxV6lqAYY20K',
    'Nguyễn Văn Cư Dân',
    'resident@bluemoon.vn',
    '0912345678',
    'RESIDENT',
    1,
    0,
    'APPROVED',
    1,
    CURRENT_TIMESTAMP,
    0
) ON DUPLICATE KEY UPDATE id = id;

-- 5. Chuẩn hóa bảng residents (PB-005: household_id, CCCD 9|12 số, THUONG_TRU / TAM_TRU, Soft Delete)
ALTER TABLE residents
    ADD COLUMN household_id INT NULL AFTER id,
    ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
    MODIFY COLUMN apartment_id INT NULL,
    MODIFY COLUMN cccd_number VARCHAR(12) NULL,
    MODIFY COLUMN gender VARCHAR(20) NOT NULL,
    MODIFY COLUMN residence_status VARCHAR(20) NOT NULL DEFAULT 'THUONG_TRU';

UPDATE residents r
JOIN households h ON h.apartment_id = r.apartment_id AND h.status = 'ACTIVE' AND h.is_deleted = 0
SET r.household_id = h.id
WHERE r.household_id IS NULL;

UPDATE residents SET residence_status = 'THUONG_TRU' WHERE residence_status = 'TAM_VANG';

ALTER TABLE residents
    ADD CONSTRAINT fk_resident_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    ADD INDEX idx_resident_household (household_id);

-- 6. Gỡ bỏ bảng residency_logs cũ (ngoài phạm vi Sprint 1 theo agile_plan.md)
DROP TABLE IF EXISTS residency_logs;
