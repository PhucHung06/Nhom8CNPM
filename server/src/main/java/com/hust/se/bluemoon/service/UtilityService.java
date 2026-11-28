package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.UtilityImportErrorDto;
import com.hust.se.bluemoon.dto.UtilityImportResultResponse;
import com.hust.se.bluemoon.dto.UtilityReadingRequest;
import com.hust.se.bluemoon.dto.UtilityReadingResponse;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.exception.ExcelImportValidationException;
import com.hust.se.bluemoon.repository.BillingCycleRepository;
import com.hust.se.bluemoon.repository.HouseholdRepository;
import com.hust.se.bluemoon.repository.UtilityReadingRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UtilityService {

    private static final Pattern PERIOD_PATTERN = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");
    private static final BigDecimal DEFAULT_ELECTRICITY_PRICE = new BigDecimal("3500.00");
    private static final BigDecimal DEFAULT_WATER_PRICE = new BigDecimal("15000.00");

    private final UtilityReadingRepository utilityReadingRepository;
    private final HouseholdRepository householdRepository;
    private final BillingCycleRepository billingCycleRepository;

    public record CalculatedUtility(
            BigDecimal oldIndex,
            BigDecimal newIndex,
            BigDecimal usageAmount,
            BigDecimal totalAmount
    ) {
    }

    public CalculatedUtility calculateUtilityAmounts(
            UtilityServiceType serviceType,
            BigDecimal rawOldIndex,
            BigDecimal rawNewIndex,
            BigDecimal rawUnitPrice) {
        if (serviceType == null) {
            throw BusinessException.badRequest("Loại dịch vụ không được để trống");
        }
        if (rawUnitPrice == null || rawUnitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw BusinessException.badRequest("Đơn giá phải lớn hơn hoặc bằng 0");
        }

        BigDecimal oldIdx = (rawOldIndex != null ? rawOldIndex : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal newIdx = (rawNewIndex != null ? rawNewIndex : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal unitPrice = rawUnitPrice.setScale(2, RoundingMode.HALF_UP);

        if (oldIdx.compareTo(BigDecimal.ZERO) < 0 || newIdx.compareTo(BigDecimal.ZERO) < 0) {
            throw BusinessException.badRequest("Chỉ số đầu và chỉ số cuối không được âm");
        }

        if (serviceType == UtilityServiceType.INTERNET) {
            if (newIdx.compareTo(oldIdx) < 0) {
                throw BusinessException.badRequest("Chỉ số cuối không được nhỏ hơn chỉ số đầu");
            }
            if (newIdx.compareTo(oldIdx) == 0 && oldIdx.compareTo(BigDecimal.ZERO) > 0) {
                throw BusinessException.badRequest("Chỉ số cuối phải lớn hơn chỉ số đầu khi có ghi nhận công tơ");
            }
            BigDecimal usage = newIdx.compareTo(oldIdx) > 0
                    ? newIdx.subtract(oldIdx).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = usage.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            return new CalculatedUtility(oldIdx, newIdx, usage, total);
        }

        if (newIdx.compareTo(oldIdx) <= 0) {
            throw BusinessException.badRequest("Chỉ số cuối phải lớn hơn chỉ số đầu đối với Điện / Nước");
        }
        BigDecimal usage = newIdx.subtract(oldIdx).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = usage.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        return new CalculatedUtility(oldIdx, newIdx, usage, total);
    }

    @Transactional(readOnly = true)
    public List<UtilityReadingResponse> searchReadings(
            String billingPeriod,
            UtilityServiceType serviceType,
            Integer householdId,
            String keyword) {
        return utilityReadingRepository.searchReadings(billingPeriod, serviceType, householdId, keyword)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UtilityReadingResponse> getResidentUtilities(
            Integer householdId,
            String billingPeriod,
            UtilityServiceType serviceType) {
        if (householdId == null) {
            return List.of();
        }
        return utilityReadingRepository.searchReadings(billingPeriod, serviceType, householdId, null)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @LogAudit(action = "CREATE_UTILITY_READING", targetTable = "utility_readings")
    public UtilityReadingResponse createReading(UtilityReadingRequest request) {
        String period = request.getBillingPeriod().trim();
        ensureCycleNotClosed(period);

        Household household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hộ gia đình có ID: " + request.getHouseholdId()));
        if (household.getStatus() != HouseholdStatus.ACTIVE) {
            throw BusinessException.badRequest("Chỉ được ghi chỉ số cho hộ gia đình đang cư trú (ACTIVE)");
        }

        CalculatedUtility calc = calculateUtilityAmounts(
                request.getServiceType(), request.getOldIndex(), request.getNewIndex(), request.getUnitPrice());

        Optional<UtilityReading> existingOpt = utilityReadingRepository
                .findByHouseholdIdAndBillingPeriodAndServiceType(household.getId(), period, request.getServiceType());

        if (existingOpt.isPresent()) {
            UtilityReading existing = existingOpt.get();
            if (!Boolean.TRUE.equals(existing.getIsDeleted())) {
                throw BusinessException.conflict(
                        "Đã tồn tại chỉ số " + request.getServiceType() + " kỳ " + period + " cho căn hộ "
                                + household.getApartment().getApartmentCode());
            }
            existing.setOldIndex(calc.oldIndex());
            existing.setNewIndex(calc.newIndex());
            existing.setUsageAmount(calc.usageAmount());
            existing.setUnitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP));
            existing.setTotalAmount(calc.totalAmount());
            existing.setIsDeleted(false);
            return toResponse(utilityReadingRepository.save(existing));
        }

        UtilityReading reading = UtilityReading.builder()
                .household(household)
                .billingPeriod(period)
                .serviceType(request.getServiceType())
                .oldIndex(calc.oldIndex())
                .newIndex(calc.newIndex())
                .usageAmount(calc.usageAmount())
                .unitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                .totalAmount(calc.totalAmount())
                .isDeleted(false)
                .build();

        return toResponse(utilityReadingRepository.save(reading));
    }

    @Transactional
    @LogAudit(action = "UPDATE_UTILITY_READING", targetTable = "utility_readings")
    public UtilityReadingResponse updateReading(Integer id, UtilityReadingRequest request) {
        UtilityReading reading = utilityReadingRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy bản ghi chỉ số có ID: " + id));

        String period = request.getBillingPeriod().trim();
        ensureCycleNotClosed(reading.getBillingPeriod());
        if (!reading.getBillingPeriod().equals(period)) {
            ensureCycleNotClosed(period);
        }

        Household household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hộ gia đình có ID: " + request.getHouseholdId()));
        if (household.getStatus() != HouseholdStatus.ACTIVE) {
            throw BusinessException.badRequest("Chỉ được cập nhật chỉ số cho hộ gia đình đang cư trú (ACTIVE)");
        }

        Optional<UtilityReading> duplicateOpt = utilityReadingRepository
                .findByHouseholdIdAndBillingPeriodAndServiceType(household.getId(), period, request.getServiceType());
        if (duplicateOpt.isPresent() && !duplicateOpt.get().getId().equals(id)) {
            throw BusinessException.conflict("Đã tồn tại bản ghi cùng kỳ thu và loại dịch vụ cho hộ này");
        }

        CalculatedUtility calc = calculateUtilityAmounts(
                request.getServiceType(), request.getOldIndex(), request.getNewIndex(), request.getUnitPrice());

        reading.setHousehold(household);
        reading.setBillingPeriod(period);
        reading.setServiceType(request.getServiceType());
        reading.setOldIndex(calc.oldIndex());
        reading.setNewIndex(calc.newIndex());
        reading.setUsageAmount(calc.usageAmount());
        reading.setUnitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP));
        reading.setTotalAmount(calc.totalAmount());

        return toResponse(utilityReadingRepository.save(reading));
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_UTILITY_READING", targetTable = "utility_readings")
    public void softDeleteReading(Integer id) {
        UtilityReading reading = utilityReadingRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy bản ghi chỉ số có ID: " + id));
        ensureCycleNotClosed(reading.getBillingPeriod());

        reading.setIsDeleted(true);
        utilityReadingRepository.save(reading);
    }

    @Transactional(readOnly = true)
    public byte[] exportTemplate(String billingPeriodParam) {
        String billingPeriod = (billingPeriodParam != null && PERIOD_PATTERN.matcher(billingPeriodParam.trim()).matches())
                ? billingPeriodParam.trim()
                : YearMonth.now().toString();

        List<Household> activeHouseholds = householdRepository.findActiveHouseholdsWithApartment();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("ChiSoDienNuoc");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {
                    "Ma_Can_Ho",
                    "Ky_Thu",
                    "Loai_Dich_Vu",
                    "Chi_So_Dau",
                    "Chi_So_Cuoi",
                    "Don_Gia"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Household h : activeHouseholds) {
                String aptCode = h.getApartment().getApartmentCode();

                BigDecimal prevElec = utilityReadingRepository
                        .findTopByHouseholdIdAndServiceTypeAndIsDeletedFalseOrderByBillingPeriodDesc(
                                h.getId(), UtilityServiceType.ELECTRICITY)
                        .map(UtilityReading::getNewIndex)
                        .orElse(BigDecimal.ZERO);

                Row elecRow = sheet.createRow(rowIdx++);
                elecRow.createCell(0).setCellValue(aptCode);
                elecRow.createCell(1).setCellValue(billingPeriod);
                elecRow.createCell(2).setCellValue(UtilityServiceType.ELECTRICITY.name());
                elecRow.createCell(3).setCellValue(prevElec.doubleValue());
                elecRow.createCell(4).setCellValue(prevElec.doubleValue());
                elecRow.createCell(5).setCellValue(DEFAULT_ELECTRICITY_PRICE.doubleValue());

                BigDecimal prevWater = utilityReadingRepository
                        .findTopByHouseholdIdAndServiceTypeAndIsDeletedFalseOrderByBillingPeriodDesc(
                                h.getId(), UtilityServiceType.WATER)
                        .map(UtilityReading::getNewIndex)
                        .orElse(BigDecimal.ZERO);

                Row waterRow = sheet.createRow(rowIdx++);
                waterRow.createCell(0).setCellValue(aptCode);
                waterRow.createCell(1).setCellValue(billingPeriod);
                waterRow.createCell(2).setCellValue(UtilityServiceType.WATER.name());
                waterRow.createCell(3).setCellValue(prevWater.doubleValue());
                waterRow.createCell(4).setCellValue(prevWater.doubleValue());
                waterRow.createCell(5).setCellValue(DEFAULT_WATER_PRICE.doubleValue());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            Sheet guideSheet = workbook.createSheet("HuongDan");
            guideSheet.createRow(0).createCell(0).setCellValue("Quy chuẩn nhập liệu Import Chỉ số Điện / Nước / Internet");
            guideSheet.createRow(1).createCell(0).setCellValue("1. Ma_Can_Ho: Mã căn hộ đang có hộ ACTIVE (VD: A1-101)");
            guideSheet.createRow(2).createCell(0).setCellValue("2. Ky_Thu: Định dạng YYYY-MM (VD: 2026-11)");
            guideSheet.createRow(3).createCell(0).setCellValue("3. Loai_Dich_Vu: ELECTRICITY, WATER hoặc INTERNET");
            guideSheet.createRow(4).createCell(0).setCellValue("4. Chi_So_Cuoi > Chi_So_Dau đối với ELECTRICITY và WATER; INTERNET có thể để 0 và 0");
            guideSheet.autoSizeColumn(0);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw BusinessException.badRequest("Không thể tạo tệp mẫu Excel: " + e.getMessage());
        }
    }

    @Transactional
    @LogAudit(action = "IMPORT_UTILITY_EXCEL", targetTable = "utility_readings")
    public UtilityImportResultResponse importFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("Vui lòng chọn tệp Excel (.xlsx) để import");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw BusinessException.badRequest("Định dạng tệp không hợp lệ. Hệ thống chỉ hỗ trợ tệp Excel .xlsx");
        }

        Map<String, Household> activeByApartmentCode = new HashMap<>();
        for (Household h : householdRepository.findActiveHouseholdsWithApartment()) {
            activeByApartmentCode.put(h.getApartment().getApartmentCode().trim().toUpperCase(Locale.ROOT), h);
        }

        List<UtilityImportErrorDto> errors = new ArrayList<>();
        List<UtilityReading> pendingSaves = new ArrayList<>();
        Set<String> seenKeysInFile = new HashSet<>();
        Set<String> periods = new LinkedHashSet<>();

        DataFormatter formatter = new DataFormatter();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            if (workbook.getNumberOfSheets() == 0) {
                throw BusinessException.badRequest("Tệp Excel không có trang tính nào");
            }
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getLastCellNum() < 6) {
                throw BusinessException.badRequest("Tệp Excel sai cấu trúc cột chuẩn (cần đủ 6 cột: Ma_Can_Ho, Ky_Thu, Loai_Dich_Vu, Chi_So_Dau, Chi_So_Cuoi, Don_Gia)");
            }

            int lastRowNum = sheet.getLastRowNum();
            int nonEmptyDataRows = 0;

            for (int r = 1; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (isRowBlank(row, formatter)) {
                    continue;
                }
                nonEmptyDataRows++;
                int displayRow = r + 1;

                String aptCodeRaw = getCellText(row.getCell(0), formatter).trim();
                String periodRaw = getCellText(row.getCell(1), formatter).trim();
                String serviceTypeRaw = getCellText(row.getCell(2), formatter).trim().toUpperCase(Locale.ROOT);
                String oldIdxRaw = getCellText(row.getCell(3), formatter).trim();
                String newIdxRaw = getCellText(row.getCell(4), formatter).trim();
                String unitPriceRaw = getCellText(row.getCell(5), formatter).trim();

                Household household = activeByApartmentCode.get(aptCodeRaw.toUpperCase(Locale.ROOT));
                if (aptCodeRaw.isEmpty() || household == null) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Mã căn hộ không tồn tại hoặc hiện chưa có hộ gia đình ACTIVE")
                            .build());
                    continue;
                }

                if (!PERIOD_PATTERN.matcher(periodRaw).matches()) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Kỳ thu '" + periodRaw + "' không đúng định dạng YYYY-MM")
                            .build());
                    continue;
                }

                if (billingCycleRepository.existsByBillingPeriodAndStatusAndIsDeletedFalse(
                        periodRaw, BillingCycleStatus.CLOSED)) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Đợt thu kỳ " + periodRaw + " đã đóng (CLOSED), không thể import chỉ số")
                            .build());
                    continue;
                }

                UtilityServiceType serviceType;
                try {
                    serviceType = UtilityServiceType.valueOf(serviceTypeRaw);
                } catch (IllegalArgumentException ex) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Loại dịch vụ '" + serviceTypeRaw + "' không hợp lệ (chỉ nhận ELECTRICITY, WATER, INTERNET)")
                            .build());
                    continue;
                }

                BigDecimal oldIdx;
                BigDecimal newIdx;
                BigDecimal unitPrice;
                try {
                    oldIdx = oldIdxRaw.isEmpty() ? BigDecimal.ZERO : parseDecimal(oldIdxRaw);
                    newIdx = newIdxRaw.isEmpty() ? BigDecimal.ZERO : parseDecimal(newIdxRaw);
                    unitPrice = parseDecimal(unitPriceRaw);
                } catch (NumberFormatException ex) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Chỉ số đầu, chỉ số cuối hoặc đơn giá không phải số hợp lệ")
                            .build());
                    continue;
                }

                CalculatedUtility calc;
                try {
                    calc = calculateUtilityAmounts(serviceType, oldIdx, newIdx, unitPrice);
                } catch (BusinessException ex) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message(ex.getMessage())
                            .build());
                    continue;
                }

                String uniqueKey = household.getId() + "|" + periodRaw + "|" + serviceType.name();
                if (!seenKeysInFile.add(uniqueKey)) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Dữ liệu bị trùng lặp trong cùng tệp Excel cho căn hộ, kỳ thu và loại dịch vụ này")
                            .build());
                    continue;
                }

                Optional<UtilityReading> existingOpt = utilityReadingRepository
                        .findByHouseholdIdAndBillingPeriodAndServiceType(household.getId(), periodRaw, serviceType);
                if (existingOpt.isPresent() && !Boolean.TRUE.equals(existingOpt.get().getIsDeleted())) {
                    errors.add(UtilityImportErrorDto.builder()
                            .rowNumber(displayRow)
                            .apartmentCode(aptCodeRaw)
                            .serviceType(serviceTypeRaw)
                            .message("Đã tồn tại chỉ số " + serviceType.name() + " kỳ " + periodRaw + " trong hệ thống")
                            .build());
                    continue;
                }

                UtilityReading entity = existingOpt.orElseGet(UtilityReading::new);
                entity.setHousehold(household);
                entity.setBillingPeriod(periodRaw);
                entity.setServiceType(serviceType);
                entity.setOldIndex(calc.oldIndex());
                entity.setNewIndex(calc.newIndex());
                entity.setUsageAmount(calc.usageAmount());
                entity.setUnitPrice(unitPrice.setScale(2, RoundingMode.HALF_UP));
                entity.setTotalAmount(calc.totalAmount());
                entity.setIsDeleted(false);

                pendingSaves.add(entity);
                periods.add(periodRaw);
            }

            if (nonEmptyDataRows == 0) {
                throw BusinessException.badRequest("Tệp Excel không có dòng dữ liệu nào để import");
            }

            if (!errors.isEmpty()) {
                throw new ExcelImportValidationException(
                        "Tệp Excel có " + errors.size() + " dòng không hợp lệ. Toàn bộ quá trình import đã được hủy (rollback).",
                        errors);
            }

            List<UtilityReadingResponse> savedResponses = utilityReadingRepository.saveAll(pendingSaves)
                    .stream()
                    .map(this::toResponse)
                    .toList();

            return UtilityImportResultResponse.builder()
                    .importedCount(savedResponses.size())
                    .billingPeriods(new ArrayList<>(periods))
                    .readings(savedResponses)
                    .build();
        } catch (ExcelImportValidationException | BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw BusinessException.badRequest("Không thể đọc tệp Excel (.xlsx): " + ex.getMessage());
        }
    }

    private void ensureCycleNotClosed(String billingPeriod) {
        if (billingCycleRepository.existsByBillingPeriodAndStatusAndIsDeletedFalse(
                billingPeriod, BillingCycleStatus.CLOSED)) {
            throw BusinessException.badRequest(
                    "Đợt thu kỳ " + billingPeriod + " đã đóng (CLOSED), không thể chỉnh sửa chỉ số");
        }
    }

    private boolean isRowBlank(Row row, DataFormatter formatter) {
        if (row == null) return true;
        for (int i = 0; i < 6; i++) {
            if (!getCellText(row.getCell(i), formatter).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String getCellText(Cell cell, DataFormatter formatter) {
        if (cell == null) return "";
        return formatter.formatCellValue(cell);
    }

    private BigDecimal parseDecimal(String raw) {
        String cleaned = raw.replace(",", "").trim();
        if (cleaned.isEmpty()) {
            throw new NumberFormatException("Empty number");
        }
        return new BigDecimal(cleaned);
    }

    private UtilityReadingResponse toResponse(UtilityReading r) {
        return UtilityReadingResponse.builder()
                .id(r.getId())
                .householdId(r.getHousehold().getId())
                .apartmentCode(r.getHousehold().getApartment().getApartmentCode())
                .headName(r.getHousehold().getHeadName())
                .billingPeriod(r.getBillingPeriod())
                .serviceType(r.getServiceType().name())
                .oldIndex(r.getOldIndex())
                .newIndex(r.getNewIndex())
                .usageAmount(r.getUsageAmount())
                .unitPrice(r.getUnitPrice())
                .totalAmount(r.getTotalAmount())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
