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
public class UtilityReadingResponse {
    private Integer id;
    private Integer householdId;
    private String apartmentCode;
    private String headName;
    private String billingPeriod;
    private String serviceType;
    private BigDecimal oldIndex;
    private BigDecimal newIndex;
    private BigDecimal usageAmount;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
}
