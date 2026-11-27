package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.AdminCreateUserRequest;
import com.hust.se.bluemoon.dto.GrantAccessRequest;
import com.hust.se.bluemoon.dto.UserSummaryResponse;
import com.hust.se.bluemoon.entity.ApprovalStatus;
import com.hust.se.bluemoon.entity.Role;
import com.hust.se.bluemoon.service.AdminUserService;
import com.hust.se.bluemoon.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) ApprovalStatus approvalStatus) {
        return ResponseEntity.ok(adminUserService.getUsers(keyword, role, approvalStatus));
    }

    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createInternalUser(request));
    }

    @PutMapping("/{id}/grant-access")
    public ResponseEntity<UserSummaryResponse> grantAccess(
            @PathVariable Integer id,
            @Valid @RequestBody GrantAccessRequest request) {
        return ResponseEntity.ok(adminUserService.grantAccess(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> softDeleteUser(@PathVariable Integer id) {
        Integer currentUserId = authService.getCurrentAuthenticatedUser().getId();
        adminUserService.softDeleteUser(id, currentUserId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm tài khoản thành công"));
    }
}
