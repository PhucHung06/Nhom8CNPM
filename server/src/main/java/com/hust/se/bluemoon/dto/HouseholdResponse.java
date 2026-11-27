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
public class HouseholdResponse {
    private Integer id;
    private Integer apartmentId;
    private String apartmentCode;
    private Integer floor;
    private Double area;
    private String headName;
    private String headCccd;
    private String phone;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;
    private String status;
    private long residentCount;
    private long linkedAccountCount;
    private LocalDateTime createdAt;
}
