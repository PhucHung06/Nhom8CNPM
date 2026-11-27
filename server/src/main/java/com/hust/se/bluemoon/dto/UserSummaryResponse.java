package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    private Integer id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String approvalStatus;
    private Boolean emailVerified;
    private Boolean isActive;
    private Integer householdId;
    private String apartmentCode;
    private String householdHeadName;
    private LocalDateTime createdAt;
}
