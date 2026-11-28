package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.UtilityServiceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UtilityReadingRequest {

    @NotNull(message = "Hộ gia đình không được để trống")
    private Integer householdId;

    @NotBlank(message = "Kỳ thu không được để trống")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Kỳ thu phải có định dạng YYYY-MM (VD: 2026-11)")
    private String billingPeriod;

    @NotNull(message = "Loại dịch vụ không được để trống")
    private UtilityServiceType serviceType;

    @DecimalMin(value = "0.00", message = "Chỉ số đầu phải lớn hơn hoặc bằng 0")
    private BigDecimal oldIndex;

    @DecimalMin(value = "0.00", message = "Chỉ số cuối phải lớn hơn hoặc bằng 0")
    private BigDecimal newIndex;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPrice;
}
