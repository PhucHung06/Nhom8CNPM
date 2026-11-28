package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
    private Integer id;
    private String invoiceCode;
    private Integer billingCycleId;
    private String cycleName;
    private Integer householdId;
    private String apartmentCode;
    private String headName;
    private String headPhone;
    private String billingPeriod;
    private LocalDate dueDate;
    private BigDecimal serviceFeeTotal;
    private BigDecimal utilityFeeTotal;
    private BigDecimal totalAmount;
    private String status;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private Integer collectedById;
    private String collectedByName;
    private String note;
    private LocalDateTime createdAt;
    private List<InvoiceItemResponse> items;
}
