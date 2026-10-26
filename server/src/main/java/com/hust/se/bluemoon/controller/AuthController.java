// FILE: server/src/main/java/com/hust/se/bluemoon/controller/AuthController.java
package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ChangePasswordRequest;
import com.hust.se.bluemoon.dto.LoginRequest;
import com.hust.se.bluemoon.dto.LoginResponse;
import com.hust.se.bluemoon.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor // Sử dụng lại Lombok để tự động Inject AuthService, bỏ Constructor viết tay
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint Đăng nhập (UC001)
     * POST http://localhost:8080/api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // Mọi lỗi sai pass/tài khoản khóa sẽ được Service ném ra dưới dạng
        // ResponseStatusException
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Endpoint Đổi mật khẩu & Đổi mật khẩu định kỳ (US-014)
     * PUT http://localhost:8080/api/auth/change-password
     */
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal,
            @RequestParam(value = "username", required = false) String fallbackUsername) {

        // Ưu tiên lấy username từ JWT Token (Principal), nếu đang test không qua Filter
        // thì lấy từ param
        String currentUsername = (principal != null) ? principal.getName() : fallbackUsername;

        if (currentUsername == null || currentUsername.isBlank()) {
            // Đã sửa: Trả về lỗi 401 Unauthorized thay vì 500 Internal Server Error
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        }

        return ResponseEntity.ok(authService.changePassword(currentUsername, request));
    }
}
