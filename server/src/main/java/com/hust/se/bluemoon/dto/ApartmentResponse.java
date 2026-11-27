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
public class ApartmentResponse {
    private Integer id;
    private String apartmentCode;
    private Integer floor;
    private Double area;
    private String status;
    private Integer activeHouseholdId;
    private String headName;
    private String headPhone;
    private long residentCount;
    private LocalDateTime createdAt;
}
