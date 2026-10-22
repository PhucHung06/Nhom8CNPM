package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ApartmentRequest {
    @NotBlank(message = "Mã căn hộ không được để trống")
    private String apartmentCode;

    @NotNull(message = "Tầng không được để trống")
    @Min(value = 1, message = "Số tầng phải lớn hơn 0")
    private Integer floor;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.1", message = "Diện tích căn hộ phải là số thực lớn hơn 0")
    private Double area;

    @NotBlank(message = "Họ tên chủ hộ không được để trống")
    private String ownerName;

    @NotBlank(message = "Số điện thoại chủ hộ không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ")
    private String ownerPhone;
}
