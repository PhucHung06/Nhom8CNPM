package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.ResidenceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ResidentRequest {
    @NotNull(message = "Vui lòng chọn hộ gia đình")
    private Integer householdId;

    @NotBlank(message = "Họ và tên nhân khẩu không được để trống")
    private String fullName;

    @NotNull(message = "Ngày sinh không được để trống")
    @PastOrPresent(message = "Ngày sinh phải nhỏ hơn hoặc bằng ngày hiện tại")
    private LocalDate dob;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    @Pattern(regexp = "^$|^(\\d{9}|\\d{12})$", message = "Số CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số")
    private String cccdNumber;

    @NotBlank(message = "Quan hệ với chủ hộ không được để trống")
    private String relationshipWithOwner;

    private ResidenceStatus residenceStatus;
}
