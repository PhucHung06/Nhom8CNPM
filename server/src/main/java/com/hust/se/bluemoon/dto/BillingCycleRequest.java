package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BillingCycleRequest {

    @NotBlank(message = "Tên đợt thu không được để trống")
    @Size(max = 120, message = "Tên đợt thu tối đa 120 ký tự")
    private String cycleName;

    @NotBlank(message = "Kỳ thu không được để trống")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Kỳ thu phải có định dạng YYYY-MM (VD: 2026-11)")
    private String billingPeriod;

    @NotNull(message = "Hạn thanh toán không được để trống")
    private LocalDate dueDate;
}
