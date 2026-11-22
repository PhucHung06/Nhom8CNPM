-- Add password history for US-014.
-- V1__init.sql creates users and must run before this migration.
CREATE TABLE IF NOT EXISTS password_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_history_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pwd_history_user_id (user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
