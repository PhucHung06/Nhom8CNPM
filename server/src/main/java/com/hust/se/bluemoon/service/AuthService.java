package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.dto.LoginRequest;
import com.hust.se.bluemoon.dto.LoginResponse;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.repository.UserRepository;
import com.hust.se.bluemoon.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!user.getIsActive() || user.getIsDeleted()) {
            throw new RuntimeException("Tài khoản đã bị khóa hoặc ngừng hoạt động");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name(), user.getFullName());

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
