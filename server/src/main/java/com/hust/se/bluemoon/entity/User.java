package com.hust.se.bluemoon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    public static final long MAX_PASSWORD_AGE_DAYS = 90L; // Chu kỳ đổi mật khẩu định kỳ: 90 ngày

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.passwordChangedAt = now;
    }

    @Column(name = "password_changed_at", nullable = false)
    @Builder.Default
    private LocalDateTime passwordChangedAt = LocalDateTime.now();

    @Column(name = "force_password_change", nullable = false)
    @Builder.Default
    private Boolean forcePasswordChange = false;

    // Hàm tiện ích tính số ngày từ lần đổi mật khẩu gần nhất
    public long getDaysSinceLastPasswordChange() {
        if (this.passwordChangedAt == null) {
            return MAX_PASSWORD_AGE_DAYS + 1;
        }
        return ChronoUnit.DAYS.between(this.passwordChangedAt, LocalDateTime.now());
    }

    // Kiểm tra mật khẩu đã quá hạn định kỳ 90 ngày hoặc bị bắt buộc đổi hay chưa
    public boolean isPasswordExpired() {
        return Boolean.TRUE.equals(this.forcePasswordChange)
                || getDaysSinceLastPasswordChange() >= MAX_PASSWORD_AGE_DAYS;
    }
}
