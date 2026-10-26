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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        initializeData();
    }

    private void initializeData() {
        seedUser("admin_01", "Hoàng Phúc Hưng", Role.ROLE_ADMIN);
        seedUser("thungan_01", "Nguyễn Thu Ngân", Role.ROLE_CASHIER);
        seedUser("canbo_cudan", "Trần Quản Lý Cư Dân", Role.ROLE_RESIDENT_MANAGER);
        seedFee("Phí dịch vụ chung cư", "SERVICE", 12000, true);
        seedFee("Phí quản lý vận hành", "MANAGEMENT", 7000, true);
        seedFee("Quỹ vì người nghèo", "VOLUNTARY", 0, false);
        seedFee("Quỹ Tết thiếu nhi", "VOLUNTARY", 0, false);
    }

    private void seedUser(String username, String fullName, Role role) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .role(role)
                .isActive(true)
                .isDeleted(false)
                .forcePasswordChange(false)
                .build();
            userRepository.save(user);
            return;
        }

        // Repair only the known demo hashes, not a user's custom password.
        if (LEGACY_SEED_HASHES.contains(user.getPasswordHash())
                && !passwordEncoder.matches(DEFAULT_PASSWORD, user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
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
