package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.*;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.PasswordHistoryRepository;
import com.hust.se.bluemoon.repository.UserRepository;
import com.hust.se.bluemoon.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;

    @Transactional
    public UserSummaryResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameAndIsDeletedFalse(username)) {
            throw BusinessException.conflict("Tên đăng nhập '" + username + "' đã được sử dụng");
        }
        if (userRepository.existsByEmailAndIsDeletedFalse(email)) {
            throw BusinessException.conflict("Email '" + email + "' đã được đăng ký");
        }

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(Role.RESIDENT)
                .isActive(true)
                .isDeleted(false)
                .approvalStatus(ApprovalStatus.PENDING)
                .emailVerified(false)
                .passwordChangedAt(LocalDateTime.now())
                .forcePasswordChange(false)
                .build();

        User saved = userRepository.save(user);
        otpService.generateAndSendOtp(email, OtpPurpose.REGISTER);
        return toSummary(saved);
    }

    @Transactional
    public void verifyRegisterOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản với email này"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw BusinessException.badRequest("Email này đã được xác thực trước đó");
        }

        otpService.verifyOtp(email, OtpPurpose.REGISTER, request.getOtp());
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản với email này"));

        if (request.getPurpose() == OtpPurpose.REGISTER && Boolean.TRUE.equals(user.getEmailVerified())) {
            throw BusinessException.badRequest("Tài khoản đã xác thực email");
        }
        otpService.generateAndSendOtp(email, request.getPurpose());
    }

    public LoginResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsernameAndIsDeletedFalse(request.getUsername().trim())
                .orElseThrow(() -> BusinessException.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("Tên đăng nhập hoặc mật khẩu không chính xác");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw BusinessException.forbidden("Tài khoản đã bị khóa hoặc ngừng hoạt động");
        }
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw BusinessException.forbidden("Tài khoản chưa xác thực OTP email");
        }
        if (user.getApprovalStatus() == ApprovalStatus.PENDING) {
            throw BusinessException.forbidden("Tài khoản đang chờ Ban quản lý duyệt và gán hộ gia đình");
        }
        if (user.getApprovalStatus() == ApprovalStatus.REJECTED) {
            throw BusinessException.forbidden("Yêu cầu đăng ký tài khoản đã bị từ chối");
        }

        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getFullName()
        );

        return buildLoginResponse(user, token);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản gắn với email này"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw BusinessException.forbidden("Tài khoản đã bị vô hiệu hóa");
        }
        otpService.generateAndSendOtp(email, OtpPurpose.RESET_PASSWORD);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản gắn với email này"));

        otpService.verifyOtp(email, OtpPurpose.RESET_PASSWORD, request.getOtp());

        passwordHistoryRepository.save(new PasswordHistory(user, user.getPasswordHash()));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setForcePasswordChange(false);
        userRepository.save(user);
    }

    @Transactional
    @LogAudit(action = "CHANGE_PASSWORD", targetTable = "users")
    public void changePassword(ChangePasswordRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        User user = userRepository.findByIdAndIsDeletedFalse(currentUser.getId())
                .orElseThrow(() -> BusinessException.notFound("Người dùng không tồn tại"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw BusinessException.badRequest("Mật khẩu hiện tại không chính xác");
        }
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw BusinessException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        passwordHistoryRepository.save(new PasswordHistory(user, user.getPasswordHash()));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setForcePasswordChange(false);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse getCurrentUserProfile() {
        User currentUser = getCurrentAuthenticatedUser();
        User user = userRepository.findByIdAndIsDeletedFalse(currentUser.getId())
                .orElseThrow(() -> BusinessException.notFound("Người dùng không tồn tại"));
        return buildLoginResponse(user, null);
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User currentUser)) {
            throw BusinessException.unauthorized("Không xác định được phiên đăng nhập");
        }
        return currentUser;
    }

    private LoginResponse buildLoginResponse(User user, String token) {
        Integer householdId = user.getHousehold() != null ? user.getHousehold().getId() : null;
        String apartmentCode = (user.getHousehold() != null && user.getHousehold().getApartment() != null)
                ? user.getHousehold().getApartment().getApartmentCode()
                : null;

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .householdId(householdId)
                .apartmentCode(apartmentCode)
                .menus(buildMenusForRole(user.getRole()))
                .passwordExpired(user.isPasswordExpired())
                .daysSinceLastChange(user.getDaysSinceLastPasswordChange())
                .maxPasswordAgeDays(User.MAX_PASSWORD_AGE_DAYS)
                .passwordChangedAt(user.getPasswordChangedAt())
                .build();
    }

    public List<MenuItemDto> buildMenusForRole(Role role) {
        if (role == Role.ADMIN) {
            return List.of(
                    new MenuItemDto("apartments", "Quản lý Căn hộ", "/apartments"),
                    new MenuItemDto("households", "Quản lý Hộ gia đình", "/households"),
                    new MenuItemDto("residents", "Quản lý Nhân khẩu", "/residents"),
                    new MenuItemDto("admin_users", "Tài khoản & Duyệt cư dân", "/admin/users")
            );
        }
        return List.of(
                new MenuItemDto("resident_home", "Thông tin Căn hộ & Hộ", "/resident/home")
        );
    }

    public static UserSummaryResponse toSummary(User u) {
        Integer householdId = u.getHousehold() != null ? u.getHousehold().getId() : null;
        String apartmentCode = (u.getHousehold() != null && u.getHousehold().getApartment() != null)
                ? u.getHousehold().getApartment().getApartmentCode()
                : null;
        String headName = u.getHousehold() != null ? u.getHousehold().getHeadName() : null;

        return UserSummaryResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .approvalStatus(u.getApprovalStatus().name())
                .emailVerified(u.getEmailVerified())
                .isActive(u.getIsActive())
                .householdId(householdId)
                .apartmentCode(apartmentCode)
                .householdHeadName(headName)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
