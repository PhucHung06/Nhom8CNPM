package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingCycleResponse {
    private Integer id;
    private String cycleName;
    private String billingPeriod;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime closedAt;
    private String createdByName;
    private long invoiceCount;
    private long paidCount;
    private long unpaidCount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private LocalDateTime createdAt;
}
