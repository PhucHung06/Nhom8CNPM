package com.hust.se.bluemoon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Sprint1IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private ResidentRepository residentRepository;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        passwordHistoryRepository.deleteAll();
        emailOtpRepository.deleteAll();
        residentRepository.deleteAll();
        userRepository.deleteAll();
        householdRepository.deleteAll();
        apartmentRepository.deleteAll();

        User admin = User.builder()
                .username("admin_test")
                .passwordHash(passwordEncoder.encode("Admin@2026"))
                .fullName("Quản Trị Viên")
                .email("admin@bluemoon.vn")
                .role(Role.ADMIN)
                .isActive(true)
                .isDeleted(false)
                .approvalStatus(ApprovalStatus.APPROVED)
                .emailVerified(true)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        userRepository.save(admin);
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of("username", username, "password", password));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    private String extractLastSentOtp() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(javaMailSender, atLeastOnce()).send(captor.capture());
        SimpleMailMessage lastMsg = captor.getAllValues().get(captor.getAllValues().size() - 1);
        Matcher matcher = Pattern.compile("\\b(\\d{6})\\b").matcher(lastMsg.getText());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    @Test
    void pb001HealthAndValidationErrorFormat() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/api/apartments"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorType").value("UNAUTHORIZED"));

        String adminToken = loginAndGetToken("admin_test", "Admin@2026");
        mockMvc.perform(post("/api/apartments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apartmentCode\":\"\",\"floor\":0,\"area\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorType").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.apartmentCode").exists());
    }

    @Test
    void pb002RegisterOtpGrantAccessRbac403AndResetPassword() throws Exception {
        // 1. Đăng ký tài khoản cư dân -> gửi OTP (lưu hash BCrypt trong email_otps)
        String regPayload = """
                {
                  "username": "cudan_a1",
                  "fullName": "Nguyễn Văn Cư Dân",
                  "email": "cudan@bluemoon.vn",
                  "phone": "0912345678",
                  "password": "User@2026"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated());

        String otp = extractLastSentOtp();
        EmailOtp savedOtp = emailOtpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc("cudan@bluemoon.vn", OtpPurpose.REGISTER)
                .orElseThrow();
        assertThat(savedOtp.getOtpHash()).isNotEqualTo(otp);
        assertThat(passwordEncoder.matches(otp, savedOtp.getOtpHash())).isTrue();

        // 2. Xác thực OTP
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"cudan@bluemoon.vn\",\"otp\":\"%s\"}", otp)))
                .andExpect(status().isOk());

        // Chưa được BQL duyệt nên chưa login được
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"cudan_a1\",\"password\":\"User@2026\"}"))
                .andExpect(status().isForbidden());

        // 3. Admin tạo căn hộ, Move-in hộ và Grant-access cho cudan_a1
        String adminToken = loginAndGetToken("admin_test", "Admin@2026");

        MvcResult aptRes = mockMvc.perform(post("/api/apartments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apartmentCode\":\"P101\",\"floor\":1,\"area\":75.5}"))
                .andExpect(status().isCreated())
                .andReturn();
        int aptId = objectMapper.readTree(aptRes.getResponse().getContentAsString()).get("id").asInt();

        MvcResult hhRes = mockMvc.perform(post("/api/households/move-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"apartmentId\":%d,\"headName\":\"Nguyễn Văn Cư Dân\",\"headCccd\":\"001090001234\",\"phone\":\"0912345678\"}",
                                aptId)))
                .andExpect(status().isCreated())
                .andReturn();
        int householdId = objectMapper.readTree(hhRes.getResponse().getContentAsString()).get("id").asInt();

        User residentUser = userRepository.findByUsernameAndIsDeletedFalse("cudan_a1").orElseThrow();
        mockMvc.perform(put("/api/admin/users/" + residentUser.getId() + "/grant-access")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"approvalStatus\":\"APPROVED\",\"householdId\":%d}", householdId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apartmentCode").value("P101"));

        // 4. Resident login & RBAC trả HTTP 403 cho route ADMIN
        String residentToken = loginAndGetToken("cudan_a1", "User@2026");
        mockMvc.perform(get("/api/apartments").header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorType").value("FORBIDDEN"));
        mockMvc.perform(get("/api/households").header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/residents").header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());

        // Resident xem được cổng thông tin hộ gia đình của mình
        mockMvc.perform(get("/api/resident/my-household").header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assigned").value(true))
                .andExpect(jsonPath("$.household.apartmentCode").value("P101"));

        // 5. Quên mật khẩu & Đặt lại mật khẩu qua OTP
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"cudan@bluemoon.vn\"}"))
                .andExpect(status().isOk());
        String resetOtp = extractLastSentOtp();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"email\":\"cudan@bluemoon.vn\",\"otp\":\"%s\",\"newPassword\":\"NewPass@2026\"}",
                                resetOtp)))
                .andExpect(status().isOk());

        loginAndGetToken("cudan_a1", "NewPass@2026");
    }

    @Test
    void pb003Pb004Pb005ApartmentHouseholdMoveInOutAndResidentValidation() throws Exception {
        String adminToken = loginAndGetToken("admin_test", "Admin@2026");

        // PB-003: Tạo căn hộ mặc định AVAILABLE
        MvcResult aptRes = mockMvc.perform(post("/api/apartments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apartmentCode\":\"A1-1205\",\"floor\":12,\"area\":85.0}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn();
        int aptId = objectMapper.readTree(aptRes.getResponse().getContentAsString()).get("id").asInt();

        // PB-004: Move-in thành công -> căn hộ chuyển OCCUPIED
        MvcResult hhRes = mockMvc.perform(post("/api/households/move-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"apartmentId\":%d,\"headName\":\"Trần Minh Chủ\",\"headCccd\":\"001085009999\",\"phone\":\"0988112233\"}",
                                aptId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.residentCount").value(1))
                .andReturn();
        int householdId = objectMapper.readTree(hhRes.getResponse().getContentAsString()).get("id").asInt();

        mockMvc.perform(get("/api/residents")
                        .param("householdId", String.valueOf(householdId))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].relationshipWithOwner").value("Chủ hộ"))
                .andExpect(jsonPath("$[0].cccdNumber").value("001085009999"));

        // Không cho phép Move-in trùng vào căn đang OCCUPIED và không cho xóa mềm căn OCCUPIED
        mockMvc.perform(post("/api/households/move-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"apartmentId\":%d,\"headName\":\"Người Khác\",\"headCccd\":\"001085008888\",\"phone\":\"0988112244\"}",
                                aptId)))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/apartments/" + aptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // PB-005: Thêm nhân khẩu với CMND 9 số và CCCD 12 số đều hợp lệ; 10 số bị chặn
        mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"fullName\":\"Trần A\",\"dob\":\"1990-01-01\",\"gender\":\"Nam\",\"cccdNumber\":\"012345678\",\"relationshipWithOwner\":\"Chủ hộ\",\"residenceStatus\":\"THUONG_TRU\"}",
                                householdId)))
                .andExpect(status().isCreated());

        MvcResult res2 = mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"fullName\":\"Trần B\",\"dob\":\"1992-05-10\",\"gender\":\"Nữ\",\"cccdNumber\":\"001192001234\",\"relationshipWithOwner\":\"Vợ\",\"residenceStatus\":\"TAM_TRU\"}",
                                householdId)))
                .andExpect(status().isCreated())
                .andReturn();
        int res2Id = objectMapper.readTree(res2.getResponse().getContentAsString()).get("id").asInt();

        // Sai định dạng 10 số -> 400
        mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"fullName\":\"Trần C\",\"dob\":\"2000-01-01\",\"gender\":\"Nam\",\"cccdNumber\":\"0123456789\",\"relationshipWithOwner\":\"Con\"}",
                                householdId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorType").value("VALIDATION_ERROR"));

        // Trùng CCCD -> 409
        mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"fullName\":\"Trần D\",\"dob\":\"2001-01-01\",\"gender\":\"Nam\",\"cccdNumber\":\"001192001234\",\"relationshipWithOwner\":\"Con\"}",
                                householdId)))
                .andExpect(status().isConflict());

        // Sửa & Xóa mềm nhân khẩu
        mockMvc.perform(put("/api/residents/" + res2Id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"fullName\":\"Trần Thị B\",\"dob\":\"1992-05-10\",\"gender\":\"Nữ\",\"cccdNumber\":\"001192001234\",\"relationshipWithOwner\":\"Vợ\",\"residenceStatus\":\"THUONG_TRU\"}",
                                householdId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Trần Thị B"));

        mockMvc.perform(delete("/api/residents/" + res2Id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // PB-004: Move-out -> căn hộ trở về AVAILABLE và có thể xóa mềm căn hộ
        mockMvc.perform(put("/api/households/" + householdId + "/move-out")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MOVED_OUT"));

        mockMvc.perform(get("/api/apartments/" + aptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));

        mockMvc.perform(delete("/api/apartments/" + aptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThat(auditLogRepository.count()).isGreaterThan(0);
    }
}
