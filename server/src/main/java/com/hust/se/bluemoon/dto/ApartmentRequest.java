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
    @Pattern(regexp = "^[A-Za-z0-9\\-_]+$", message = "Mã căn hộ chỉ bao gồm chữ cái không dấu, chữ số, dấu gạch ngang hoặc gạch dưới (VD: A1-1205, P101)")
    private String apartmentCode;

    @NotNull(message = "Tầng không được để trống")
    @Min(value = 1, message = "Số tầng phải lớn hơn 0")
    @Max(value = 100, message = "Số tầng không được vượt quá 100")
    private Integer floor;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.01", message = "Diện tích căn hộ phải là số thực lớn hơn 0")
    @DecimalMax(value = "10000.0", message = "Diện tích căn hộ không hợp lệ")
    private Double area;

    @NotBlank(message = "Họ tên chủ hộ không được để trống")
    @Size(max = 100, message = "Họ tên chủ hộ không được vượt quá 100 ký tự")
    private String ownerName;

    @Pattern(regexp = "^$|^\\d{12}$", message = "Số CCCD chủ hộ phải gồm đúng 12 chữ số")
    private String ownerCccd;

    @NotBlank(message = "Số điện thoại chủ hộ không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ (gồm 10 chữ số bắt đầu bằng 0 hoặc +84)")
    private String ownerPhone;

    private ApartmentStatus status;
}