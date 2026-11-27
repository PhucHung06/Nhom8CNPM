package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.entity.EmailOtp;
import com.hust.se.bluemoon.entity.OtpPurpose;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailOtpRepository emailOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiration-minutes:5}")
    private long expirationMinutes;

    @Value("${app.otp.dev-log-enabled:true}")
    private boolean devLogEnabled;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:noreply@bluemoon.vn}")
    private String mailFrom;

    @Transactional
    public void generateAndSendOtp(String rawEmail, OtpPurpose purpose) {
        String email = rawEmail.trim().toLowerCase();
        emailOtpRepository.invalidateActiveOtps(email, purpose);

        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailOtp entity = EmailOtp.builder()
                .email(email)
                .otpHash(passwordEncoder.encode(otpCode))
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .used(false)
                .build();
        emailOtpRepository.save(entity);

        if (devLogEnabled) {
            log.info("[OTP-DEV] Email: {} | Purpose: {} | OTP: {} (TTL {} phút)", email, purpose, otpCode, expirationMinutes);
        }

        if (StringUtils.hasText(mailHost)) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(StringUtils.hasText(mailFrom) ? mailFrom : "noreply@bluemoon.vn");
            message.setTo(email);
            message.setSubject(purpose == OtpPurpose.REGISTER
                    ? "[BlueMoon] Mã OTP xác thực đăng ký tài khoản"
                    : "[BlueMoon] Mã OTP đặt lại mật khẩu");
            message.setText("Mã xác thực OTP của bạn là: " + otpCode
                    + "\nMã có hiệu lực trong " + expirationMinutes + " phút. Vui lòng không chia sẻ mã này.");
            mailSender.send(message);
        }
    }

    @Transactional
    public void verifyOtp(String rawEmail, OtpPurpose purpose, String otpCode) {
        String email = rawEmail.trim().toLowerCase();
        EmailOtp latest = emailOtpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> BusinessException.badRequest("Không tìm thấy mã OTP hợp lệ. Vui lòng yêu cầu gửi lại mã."));

        if (latest.getExpiresAt().isBefore(LocalDateTime.now())) {
            latest.setUsed(true);
            emailOtpRepository.save(latest);
            throw BusinessException.badRequest("Mã OTP đã hết hạn (quá " + expirationMinutes + " phút). Vui lòng gửi lại mã mới.");
        }

        if (!passwordEncoder.matches(otpCode.trim(), latest.getOtpHash())) {
            throw BusinessException.badRequest("Mã OTP không chính xác");
        }

        latest.setUsed(true);
        emailOtpRepository.save(latest);
    }
}
