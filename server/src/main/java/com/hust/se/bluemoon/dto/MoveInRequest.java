package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MoveInRequest {
    @NotNull(message = "Vui lòng chọn căn hộ trống (AVAILABLE)")
    private Integer apartmentId;

    @NotBlank(message = "Họ tên chủ hộ không được để trống")
    @Size(max = 100, message = "Họ tên chủ hộ không được vượt quá 100 ký tự")
    private String headName;

    @NotBlank(message = "Số CCCD chủ hộ không được để trống")
    @Pattern(regexp = "^\\d{12}$", message = "Số CCCD chủ hộ khi chuyển đến phải gồm đúng 12 chữ số")
    private String headCccd;

    @NotBlank(message = "Số điện thoại chủ hộ không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    private LocalDate moveInDate;
}
