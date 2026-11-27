package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentResponse {
    private Integer id;
    private Integer householdId;
    private Integer apartmentId;
    private String apartmentCode;
    private String headName;
    private String fullName;
    private LocalDate dob;
    private String gender;
    private String cccdNumber;
    private String relationshipWithOwner;
    private String residenceStatus;
    private LocalDateTime createdAt;
}
