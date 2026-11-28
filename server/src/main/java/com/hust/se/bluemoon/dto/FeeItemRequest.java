package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.FeeType;
import com.hust.se.bluemoon.entity.FeeUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FeeItemRequest {

    @NotBlank(message = "Tên khoản thu không được để trống")
    @Size(max = 100, message = "Tên khoản thu tối đa 100 ký tự")
    private String feeName;

    @NotNull(message = "Loại khoản thu không được để trống")
    private FeeType feeType;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.00", message = "Đơn giá phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPrice;

    @NotNull(message = "Đơn vị tính không được để trống")
    private FeeUnit unit;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private Boolean isActive;
}
