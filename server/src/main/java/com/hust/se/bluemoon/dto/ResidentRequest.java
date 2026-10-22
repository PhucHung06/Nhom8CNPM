package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ResidentRequest {
    @NotNull(message = "ID căn hộ không được để trống")
    private Integer apartmentId;

    @NotBlank(message = "Họ và tên nhân khẩu không được để trống")
    private String fullName;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải nhỏ hơn ngày hiện tại")
    private LocalDate dob;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    @Pattern(regexp = "^$|[0-9]{12}", message = "Số CCCD phải gồm đúng 12 chữ số")
    private String cccdNumber;

    @NotBlank(message = "Quan hệ với chủ hộ không được để trống")
    private String relationshipWithOwner;
}
