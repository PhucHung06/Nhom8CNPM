package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeItemResponse {
    private Integer id;
    private String feeName;
    private String feeType;
    private BigDecimal unitPrice;
    private String unit;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
