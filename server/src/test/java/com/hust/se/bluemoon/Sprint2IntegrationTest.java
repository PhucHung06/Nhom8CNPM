package com.hust.se.bluemoon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.repository.*;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Sprint2IntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private InvoiceItemRepository invoiceItemRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private BillingCycleRepository billingCycleRepository;
    @Autowired private UtilityReadingRepository utilityReadingRepository;
    @Autowired private FeeItemRepository feeItemRepository;

    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PasswordHistoryRepository passwordHistoryRepository;
    @Autowired private EmailOtpRepository emailOtpRepository;
    @Autowired private ResidentRepository residentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private HouseholdRepository householdRepository;
    @Autowired private ApartmentRepository apartmentRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    private String adminToken;
    private String resident1Token;
    private Household activeHousehold1;
    private Household activeHousehold2;
    private Household movedOutHousehold;

    @BeforeEach
    void setUp() throws Exception {
        cleanAllTables();

        User admin = User.builder()
                .username("admin_s2")
                .passwordHash(passwordEncoder.encode("Admin@2026"))
                .fullName("Quản Trị Viên S2")
                .email("admin_s2@bluemoon.vn")
                .role(Role.ADMIN)
                .isActive(true)
                .isDeleted(false)
                .approvalStatus(ApprovalStatus.APPROVED)
                .emailVerified(true)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        userRepository.save(admin);

        Apartment apt1 = apartmentRepository.save(Apartment.builder()
                .apartmentCode("A1-101").floor(1).area(80.0).status(ApartmentStatus.OCCUPIED).build());
        Apartment apt2 = apartmentRepository.save(Apartment.builder()
                .apartmentCode("A1-102").floor(1).area(60.0).status(ApartmentStatus.OCCUPIED).build());
        Apartment apt3 = apartmentRepository.save(Apartment.builder()
                .apartmentCode("A1-103").floor(1).area(50.0).status(ApartmentStatus.AVAILABLE).build());

        activeHousehold1 = householdRepository.save(Household.builder()
                .apartment(apt1).headName("Nguyễn Văn A").headCccd("001090000001")
                .phone("0901000001").moveInDate(LocalDate.of(2026, 1, 1))
                .status(HouseholdStatus.ACTIVE).build());
        activeHousehold2 = householdRepository.save(Household.builder()
                .apartment(apt2).headName("Trần Thị B").headCccd("001090000002")
                .phone("0901000002").moveInDate(LocalDate.of(2026, 2, 1))
                .status(HouseholdStatus.ACTIVE).build());
        movedOutHousehold = householdRepository.save(Household.builder()
                .apartment(apt3).headName("Lê Văn C").headCccd("001090000003")
                .phone("0901000003").moveInDate(LocalDate.of(2025, 1, 1))
                .moveOutDate(LocalDate.of(2026, 5, 1))
                .status(HouseholdStatus.MOVED_OUT).build());

        // 2 nhân khẩu trong hộ 1, 1 nhân khẩu trong hộ 2
        residentRepository.save(Resident.builder()
                .household(activeHousehold1).fullName("Nguyễn Văn A").dob(LocalDate.of(1990, 1, 1))
                .gender("Nam").cccdNumber("001090000001").relationshipWithOwner("Chủ hộ")
                .residenceStatus(ResidenceStatus.THUONG_TRU).build());
        residentRepository.save(Resident.builder()
                .household(activeHousehold1).fullName("Nguyễn Thị A2").dob(LocalDate.of(1992, 2, 2))
                .gender("Nữ").cccdNumber("001092000002").relationshipWithOwner("Vợ")
                .residenceStatus(ResidenceStatus.THUONG_TRU).build());
        residentRepository.save(Resident.builder()
                .household(activeHousehold2).fullName("Trần Thị B").dob(LocalDate.of(1991, 3, 3))
                .gender("Nữ").cccdNumber("001091000003").relationshipWithOwner("Chủ hộ")
                .residenceStatus(ResidenceStatus.THUONG_TRU).build());

        User residentUser = User.builder()
                .username("resident_s2")
                .passwordHash(passwordEncoder.encode("User@2026"))
                .fullName("Nguyễn Văn A")
                .email("resident_s2@bluemoon.vn")
                .role(Role.RESIDENT)
                .household(activeHousehold1)
                .isActive(true)
                .isDeleted(false)
                .approvalStatus(ApprovalStatus.APPROVED)
                .emailVerified(true)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        userRepository.save(residentUser);

        adminToken = login("admin_s2", "Admin@2026");
        resident1Token = login("resident_s2", "User@2026");
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    private void cleanAllTables() {
        invoiceItemRepository.deleteAll();
        invoiceRepository.deleteAll();
        billingCycleRepository.deleteAll();
        utilityReadingRepository.deleteAll();
        feeItemRepository.deleteAll();
        auditLogRepository.deleteAll();
        passwordHistoryRepository.deleteAll();
        emailOtpRepository.deleteAll();
        residentRepository.deleteAll();
        userRepository.deleteAll();
        householdRepository.deleteAll();
        apartmentRepository.deleteAll();
    }

    private String login(String username, String password) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("username", username, "password", password));
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void rbac403BlocksResidentFromAdminFinanceEndpoints() throws Exception {
        mockMvc.perform(get("/api/fees").header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/utilities").header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/billing-cycles").header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/invoices").header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void pb006FeeCrudSoftDeleteAndAuditLog() throws Exception {
        // Tạo khoản thu hợp lệ
        MvcResult createRes = mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"feeName":"Phí dịch vụ","feeType":"MANDATORY","unitPrice":10000,"unit":"M2","description":"Theo m2"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.feeName").value("Phí dịch vụ"))
                .andReturn();
        int feeId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asInt();

        // Trùng tên -> 409
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"feeName":"Phí dịch vụ","feeType":"MANDATORY","unitPrice":12000,"unit":"M2"}
                                """))
                .andExpect(status().isConflict());

        // Đơn giá âm -> 400 VALIDATION_ERROR
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"feeName":"Phí âm","feeType":"MANDATORY","unitPrice":-100,"unit":"M2"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorType").value("VALIDATION_ERROR"));

        // Sửa & Xóa mềm
        mockMvc.perform(put("/api/fees/" + feeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"feeName":"Phí dịch vụ chung cư","feeType":"MANDATORY","unitPrice":12000,"unit":"M2","isActive":true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unitPrice").value(12000));

        mockMvc.perform(delete("/api/fees/" + feeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Tạo lại đúng tên đã xóa mềm -> khôi phục thành công
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"feeName":"Phí dịch vụ chung cư","feeType":"MANDATORY","unitPrice":12000,"unit":"M2"}
                                """))
                .andExpect(status().isCreated());

        assertThat(auditLogRepository.count()).isGreaterThan(0);
    }

    @Test
    void pb007UtilityTemplateAndTransactionalExcelImportRollback() throws Exception {
        // 1. Tải template .xlsx hợp lệ
        MvcResult tplRes = mockMvc.perform(get("/api/utilities/template?billingPeriod=2026-11")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        byte[] tplBytes = tplRes.getResponse().getContentAsByteArray();
        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(tplBytes))) {
            Sheet sheet = wb.getSheetAt(0);
            assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Ma_Can_Ho");
            assertThat(sheet.getLastRowNum()).isGreaterThanOrEqualTo(4);
        }

        // 2. Nhập tay chỉ số cuối <= đầu -> 400
        mockMvc.perform(post("/api/utilities")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"billingPeriod\":\"2026-11\",\"serviceType\":\"ELECTRICITY\",\"oldIndex\":200,\"newIndex\":150,\"unitPrice\":3500}",
                                activeHousehold1.getId())))
                .andExpect(status().isBadRequest());

        // 3. Import Excel có 1 dòng đúng + 1 dòng sai -> Rollback 100%, trả rowErrors
        byte[] invalidExcel = buildExcelBytes(new Object[][]{
                {"A1-101", "2026-11", "ELECTRICITY", 100, 200, 3500},
                {"A1-102", "2026-11", "WATER", 50, 40, 15000} // Lỗi: 40 <= 50
        });
        MockMultipartFile badFile = new MockMultipartFile(
                "file", "bad.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", invalidExcel);

        mockMvc.perform(multipart("/api/utilities/import")
                        .file(badFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorType").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.rowErrors[0].rowNumber").value(3));

        // Đảm bảo dòng 1 cũng bị rollback (0 bản ghi trong DB)
        assertThat(utilityReadingRepository.count()).isZero();

        // 4. Import Excel hợp lệ -> lưu đủ 2 dòng
        byte[] validExcel = buildExcelBytes(new Object[][]{
                {"A1-101", "2026-11", "ELECTRICITY", 100, 200, 3500},
                {"A1-102", "2026-11", "WATER", 10, 25, 15000}
        });
        MockMultipartFile goodFile = new MockMultipartFile(
                "file", "good.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", validExcel);

        mockMvc.perform(multipart("/api/utilities/import")
                        .file(goodFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importedCount").value(2));

        assertThat(utilityReadingRepository.count()).isEqualTo(2);
    }

    @Test
    void pb008AndPb009BillingCycleIdempotentCashPaymentAndAntiIdor() throws Exception {
        // Setup 2 khoản bắt buộc (M2 + PERSON) và 1 khoản tự nguyện (không auto-bill)
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feeName\":\"Phí DV\",\"feeType\":\"MANDATORY\",\"unitPrice\":10000,\"unit\":\"M2\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feeName\":\"Phí VS\",\"feeType\":\"MANDATORY\",\"unitPrice\":6000,\"unit\":\"PERSON\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feeName\":\"Quỹ từ thiện\",\"feeType\":\"VOLUNTARY\",\"unitPrice\":50000,\"unit\":\"HOUSEHOLD\"}"))
                .andExpect(status().isCreated());

        // Ghi chỉ số điện cho hộ 1: (200 - 100) * 3500 = 350.000
        mockMvc.perform(post("/api/utilities")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"householdId\":%d,\"billingPeriod\":\"2026-11\",\"serviceType\":\"ELECTRICITY\",\"oldIndex\":100,\"newIndex\":200,\"unitPrice\":3500}",
                                activeHousehold1.getId())))
                .andExpect(status().isCreated());

        // Lập đợt thu 2026-11
        MvcResult cycleRes = mockMvc.perform(post("/api/billing-cycles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cycleName\":\"Đợt thu tháng 11/2026\",\"billingPeriod\":\"2026-11\",\"dueDate\":\"2026-11-25\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        int cycleId = objectMapper.readTree(cycleRes.getResponse().getContentAsString()).get("id").asInt();

        // Trùng kỳ -> 409
        mockMvc.perform(post("/api/billing-cycles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cycleName\":\"Trùng kỳ\",\"billingPeriod\":\"2026-11\",\"dueDate\":\"2026-11-25\"}"))
                .andExpect(status().isConflict());

        // Sinh hóa đơn lần 1: chỉ sinh cho 2 hộ ACTIVE (bỏ qua movedOutHousehold)
        // Hộ 1: 80 * 10.000 + 2 * 6.000 = 812.000 phí + 350.000 điện = 1.162.000
        mockMvc.perform(post("/api/billing-cycles/" + cycleId + "/generate-invoices")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveHouseholds").value(2))
                .andExpect(jsonPath("$.createdCount").value(2))
                .andExpect(jsonPath("$.skippedCount").value(0));

        // Sinh hóa đơn lần 2 (Idempotent) -> createdCount = 0, skippedCount = 2
        mockMvc.perform(post("/api/billing-cycles/" + cycleId + "/generate-invoices")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdCount").value(0))
                .andExpect(jsonPath("$.skippedCount").value(2));

        // Lọc hóa đơn hộ 1 và kiểm tra công thức
        MvcResult invSearchRes = mockMvc.perform(get("/api/invoices?billingPeriod=2026-11&keyword=A1-101")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].serviceFeeTotal").value(812000))
                .andExpect(jsonPath("$[0].utilityFeeTotal").value(350000))
                .andExpect(jsonPath("$[0].totalAmount").value(1162000))
                .andReturn();
        int inv1Id = objectMapper.readTree(invSearchRes.getResponse().getContentAsString()).get(0).get("id").asInt();

        MvcResult inv2SearchRes = mockMvc.perform(get("/api/invoices?billingPeriod=2026-11&keyword=A1-102")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        int inv2Id = objectMapper.readTree(inv2SearchRes.getResponse().getContentAsString()).get(0).get("id").asInt();

        // Xác nhận thu tiền mặt -> PAID
        mockMvc.perform(put("/api/invoices/" + inv1Id + "/pay-cash")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"Thu đủ tiền mặt\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.collectedByName").value("Quản Trị Viên S2"));

        // Chặn thu trùng 2 lần -> 409
        mockMvc.perform(put("/api/invoices/" + inv1Id + "/pay-cash")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"Thu lại\"}"))
                .andExpect(status().isConflict());

        // Đóng đợt thu -> CLOSED và khóa sinh thêm hóa đơn
        mockMvc.perform(put("/api/billing-cycles/" + cycleId + "/close")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/billing-cycles/" + cycleId + "/generate-invoices")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // Cổng Cư dân: xem đúng dữ liệu hộ mình và bị chặn 403 khi xem hóa đơn hộ khác (IDOR)
        mockMvc.perform(get("/api/resident/utilities")
                        .header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].apartmentCode").value("A1-101"));

        mockMvc.perform(get("/api/resident/invoices")
                        .header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PAID"));

        mockMvc.perform(get("/api/resident/invoices/" + inv2Id)
                        .header("Authorization", "Bearer " + resident1Token))
                .andExpect(status().isForbidden());
    }

    private byte[] buildExcelBytes(Object[][] rows) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("ChiSoDienNuoc");
            Row header = sheet.createRow(0);
            String[] cols = {"Ma_Can_Ho", "Ky_Thu", "Loai_Dich_Vu", "Chi_So_Dau", "Chi_So_Cuoi", "Don_Gia"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    Object val = rows[r][c];
                    if (val instanceof Number num) {
                        row.createCell(c).setCellValue(num.doubleValue());
                    } else {
                        row.createCell(c).setCellValue(String.valueOf(val));
                    }
                }
            }
            wb.write(out);
            return out.toByteArray();
        }
    }
}
