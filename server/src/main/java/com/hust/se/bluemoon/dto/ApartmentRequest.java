package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.ApartmentStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentRequest {
    @NotBlank(message = "Mã căn hộ không được để trống")
    @Size(max = 20, message = "Mã căn hộ không được vượt quá 20 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9\\-_]+$", message = "Mã căn hộ chỉ bao gồm chữ cái không dấu, chữ số, dấu gạch ngang hoặc gạch dưới")
    private String apartmentCode;

    @NotNull(message = "Tầng không được để trống")
    @Min(value = 1, message = "Số tầng phải lớn hơn 0")
    @Max(value = 100, message = "Số tầng không được vượt quá 100")
    private Integer floor;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.01", message = "Diện tích căn hộ phải lớn hơn 0")
    @DecimalMax(value = "10000.0", message = "Diện tích căn hộ không hợp lệ")
    private Double area;

    private ApartmentStatus status;
}
