// FILE: server/src/main/java/com/hust/se/bluemoon/service/AuthService.java
package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.ChangePasswordRequest;
import com.hust.se.bluemoon.dto.LoginRequest;
import com.hust.se.bluemoon.dto.LoginResponse;
import com.hust.se.bluemoon.entity.PasswordHistory;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.repository.PasswordHistoryRepository;
import com.hust.se.bluemoon.repository.UserRepository;
import com.hust.se.bluemoon.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor // Tự động tạo constructor cho các biến final, tiết kiệm code
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Xử lý UC001: Đăng nhập & Kiểm tra hạn mật khẩu định kỳ
     */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tên đăng nhập hoặc mật khẩu không chính xác"));

        // Luồng 5a trong SRS: Kiểm tra cờ is_active = 1 và is_deleted = 0
        if (Boolean.FALSE.equals(user.getIsActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên");
        }

        // Bước 4 trong SRS: Đối chiếu mật khẩu bằng thuật toán BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        // Đã SỬA LỖI: Truyền đủ 3 tham số cho hàm generateToken như code cũ của nhóm
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name(), user.getFullName());

        // Đã TỐI ƯU: Dùng Builder thay cho new Constructor để code dễ đọc và không bao
        // giờ nhầm thứ tự
        return LoginResponse.builder()
                .accessToken(token)
                // tokenType không cần truyền vì đã có mặc định là "Bearer"
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .passwordExpired(user.isPasswordExpired())
                .daysSinceLastChange(user.getDaysSinceLastPasswordChange())
                .maxPasswordAgeDays(User.MAX_PASSWORD_AGE_DAYS)
                .passwordChangedAt(user.getPasswordChangedAt())
                .build();
    }

    /**
     * Xử lý US-014: Đổi mật khẩu & Gia hạn chu kỳ mật khẩu định kỳ (90 ngày)
     */
    @Transactional // Bắt buộc phải có để rollback nếu 1 trong các thao tác DB bị lỗi
    @LogAudit(action = "CHANGE_PASSWORD", targetTable = "users")
    public Map<String, Object> changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản người dùng"));

        // 1. Kiểm tra mật khẩu xác nhận khớp nhau
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu xác nhận không khớp với mật khẩu mới");
        }

        // 2. Kiểm tra mật khẩu hiện tại bằng BCrypt
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác");
        }

        // 3. Không cho phép mật khẩu mới trùng với mật khẩu hiện tại
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu đang sử dụng");
        }

        // 4. Kiểm tra không trùng với 3 mật khẩu gần nhất trong bảng password_histories
        List<PasswordHistory> recentPasswords = passwordHistoryRepository
                .findTop3ByUserIdOrderByChangedAtDesc(user.getId());
        for (PasswordHistory history : recentPasswords) {
            if (passwordEncoder.matches(request.getNewPassword(), history.getPasswordHash())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Mật khẩu mới không được trùng với 3 mật khẩu đã sử dụng gần đây");
            }
        }

        // 5. Lưu mật khẩu cũ vào lịch sử trước khi cập nhật
        passwordHistoryRepository.save(new PasswordHistory(user, user.getPasswordHash()));

        // 6. Băm mật khẩu mới bằng BCrypt và làm mới thời gian định kỳ
        String newHashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(newHashedPassword);
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setForcePasswordChange(false);
        userRepository.save(user);

        return Map.of(
                "success", true,
                "message", "Đổi mật khẩu thành công! Chu kỳ bảo mật 90 ngày đã được làm mới.",
                "passwordChangedAt", user.getPasswordChangedAt(),
                "daysSinceLastChange", 0);
    }
}