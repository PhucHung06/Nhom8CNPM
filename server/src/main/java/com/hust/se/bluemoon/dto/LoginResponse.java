package com.hust.se.bluemoon.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Integer userId;
    private String username;
    private String fullName;
    private String role;
    // Thông tin phục vụ cảnh báo & bắt buộc đổi mật khẩu định kỳ (US-014)
    private boolean passwordExpired;
    private long daysSinceLastChange;
    private long maxPasswordAgeDays;
    private LocalDateTime passwordChangedAt;
}
