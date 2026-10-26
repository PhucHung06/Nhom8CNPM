package com.hust.se.bluemoon.config;

import com.hust.se.bluemoon.entity.Role;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Creates initial accounts and fee configuration without requiring manual INSERTs.
 * Existing non-seed passwords and existing fee rows are preserved.
 */
@Component
@RequiredArgsConstructor
public class InitialDataConfig implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD = "BlueMoon@2026";

    // Legacy hashes shipped in the SQL files; replace only these known seed values.
    private static final Set<String> LEGACY_SEED_HASHES = Set.of(
        "$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a",
        "$2a$10$wK1k6pY7B71kY8O1G/1.i.X6Kqv7fHqO79W68b3zGz3y5rF/G7z5K"
    );
    private static final Set<String> LEGACY_SEED_PASSWORDS = Set.of(
        "123456",
        "Admin@2026"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        initializeData();
    }

    private void initializeData() {
        seedUser("admin_01", "Hoàng Phúc Hưng", Role.ROLE_ADMIN, true, false, LocalDateTime.now());
        seedUser("thungan_01", "Nguyễn Thu Ngân", Role.ROLE_CASHIER, true, false,
                LocalDateTime.now().minusDays(95));
        seedUser("canbo_cudan", "Trần Quản Lý Cư Dân", Role.ROLE_RESIDENT_MANAGER, true, false,
                LocalDateTime.now());
        seedUser("locked_user", "Nhân Viên Cũ", Role.ROLE_RESIDENT_MANAGER, false, false,
                LocalDateTime.now());
        seedFee("Phí dịch vụ chung cư", "SERVICE", 12000, true);
        seedFee("Phí quản lý vận hành", "MANAGEMENT", 7000, true);
        seedFee("Quỹ vì người nghèo", "VOLUNTARY", 0, false);
        seedFee("Quỹ Tết thiếu nhi", "VOLUNTARY", 0, false);
    }

    private void seedUser(
            String username,
            String fullName,
            Role role,
            boolean active,
            boolean deleted,
            LocalDateTime passwordChangedAt) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .role(role)
                .isActive(active)
                .isDeleted(deleted)
                .passwordChangedAt(passwordChangedAt)
                .forcePasswordChange(false)
                .build();
            userRepository.save(user);
            return;
        }

        // Repair only known seed credentials, not a user's custom BCrypt password.
        String storedPassword = user.getPasswordHash();
        boolean legacyHash = LEGACY_SEED_HASHES.contains(storedPassword);
        boolean legacyPlainText = LEGACY_SEED_PASSWORDS.contains(storedPassword);
        boolean defaultPassword = passwordEncoder.matches(DEFAULT_PASSWORD, storedPassword);
        if (legacyHash || legacyPlainText || defaultPassword) {
            user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
            user.setIsActive(active);
            user.setIsDeleted(deleted);
            user.setPasswordChangedAt(passwordChangedAt);
            user.setForcePasswordChange(false);
            userRepository.save(user);
        }
    }

    private void seedFee(String name, String type, double price, boolean mandatory) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM fee_configs WHERE fee_name = ?", Integer.class, name);
        if (count == null || count == 0) {
            jdbcTemplate.update(
                "INSERT INTO fee_configs (fee_name, fee_type, unit_price, is_mandatory, is_active) VALUES (?, ?, ?, ?, 1)",
                name, type, price, mandatory ? 1 : 0);
        }
    }
}
