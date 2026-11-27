package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private String email;
    private String role;
    private Integer householdId;
    private String apartmentCode;
    private List<MenuItemDto> menus;
    private boolean passwordExpired;
    private long daysSinceLastChange;
    private long maxPasswordAgeDays;
    private LocalDateTime passwordChangedAt;
}
