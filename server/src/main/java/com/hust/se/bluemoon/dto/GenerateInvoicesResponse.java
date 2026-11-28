package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateInvoicesResponse {
    private Integer billingCycleId;
    private String billingPeriod;
    private int totalActiveHouseholds;
    private int createdCount;
    private int skippedCount;
    private BigDecimal totalGeneratedAmount;
}
