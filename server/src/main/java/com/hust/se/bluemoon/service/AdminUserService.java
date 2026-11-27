package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.AdminCreateUserRequest;
import com.hust.se.bluemoon.dto.GrantAccessRequest;
import com.hust.se.bluemoon.dto.UserSummaryResponse;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.HouseholdRepository;
import com.hust.se.bluemoon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsers(String keyword, Role role, ApprovalStatus approvalStatus) {
        return userRepository.searchUsers(keyword, role, approvalStatus)
                .stream()
                .map(AuthService::toSummary)
                .toList();
    }

    @Transactional
    @LogAudit(action = "CREATE_USER", targetTable = "users")
    public UserSummaryResponse createInternalUser(AdminCreateUserRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsernameAndIsDeletedFalse(username)) {
            throw BusinessException.conflict("Tên đăng nhập '" + username + "' đã tồn tại");
        }

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : null;
        if (email != null && userRepository.existsByEmailAndIsDeletedFalse(email)) {
            throw BusinessException.conflict("Email '" + email + "' đã được sử dụng");
        }

        Household household = null;
        if (request.getRole() == Role.RESIDENT && request.getHouseholdId() != null) {
            household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                    .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));
            if (household.getStatus() != HouseholdStatus.ACTIVE) {
                throw BusinessException.badRequest("Chỉ được gán tài khoản vào hộ gia đình đang cư trú (ACTIVE)");
            }
        }

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null)
                .role(request.getRole())
                .isActive(true)
                .isDeleted(false)
                .approvalStatus(ApprovalStatus.APPROVED)
                .emailVerified(true)
                .household(household)
                .passwordChangedAt(LocalDateTime.now())
                .forcePasswordChange(false)
                .build();

        return AuthService.toSummary(userRepository.save(user));
    }

    @Transactional
    @LogAudit(action = "GRANT_ACCESS", targetTable = "users")
    public UserSummaryResponse grantAccess(Integer userId, GrantAccessRequest request) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản"));

        if (request.getApprovalStatus() == ApprovalStatus.APPROVED && user.getRole() == Role.RESIDENT) {
            if (request.getHouseholdId() == null) {
                throw BusinessException.badRequest("Vui lòng chọn hộ gia đình để gán cho tài khoản cư dân");
            }
            Household household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                    .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));
            if (household.getStatus() != HouseholdStatus.ACTIVE) {
                throw BusinessException.badRequest("Không thể gán quyền vào hộ gia đình đã chuyển đi");
            }
            user.setHousehold(household);
        } else if (request.getApprovalStatus() == ApprovalStatus.REJECTED) {
            user.setHousehold(null);
        }

        user.setApprovalStatus(request.getApprovalStatus());
        return AuthService.toSummary(userRepository.save(user));
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_USER", targetTable = "users")
    public void softDeleteUser(Integer userId, Integer currentUserId) {
        if (userId.equals(currentUserId)) {
            throw BusinessException.badRequest("Không thể tự xóa tài khoản đang đăng nhập");
        }
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản"));
        user.setIsDeleted(true);
        user.setIsActive(false);
        userRepository.save(user);
    }
}
