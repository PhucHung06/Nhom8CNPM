// FILE: server/src/main/java/com/hust/se/bluemoon/dto/ChangePasswordRequest.java
package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải từ 8 đến 100 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d).{8,100}$",
        message = "Mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 số"
    )
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    private String confirmPassword;
}