-- =====================================================================
-- FILE: database/migrations/V3__enhance_apartments_household.sql
-- Mục đích: Bổ sung trường CCCD chủ hộ và Index tìm kiếm cho US-001 (UC003)
-- =====================================================================

USE bluemoon_db;

-- 1. Bổ sung cột số CCCD chủ hộ (12 chữ số theo đặc tả UC003 trong SRS)
ALTER TABLE apartments
    ADD COLUMN owner_cccd CHAR(12) NULL AFTER owner_name;

-- 2. Đánh chỉ mục phục vụ tìm kiếm nhanh theo tên chủ hộ (< 3 giây theo AC-003)
CREATE INDEX idx_apartment_owner_name ON apartments (owner_name);