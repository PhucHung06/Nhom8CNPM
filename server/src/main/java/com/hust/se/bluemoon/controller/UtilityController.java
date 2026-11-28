package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.UtilityImportResultResponse;
import com.hust.se.bluemoon.dto.UtilityReadingRequest;
import com.hust.se.bluemoon.dto.UtilityReadingResponse;
import com.hust.se.bluemoon.entity.UtilityServiceType;
import com.hust.se.bluemoon.service.UtilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilities")
@RequiredArgsConstructor
public class UtilityController {

    private static final String XLSX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final UtilityService utilityService;

    @GetMapping
    public ResponseEntity<List<UtilityReadingResponse>> searchReadings(
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(required = false) UtilityServiceType serviceType,
            @RequestParam(required = false) Integer householdId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(utilityService.searchReadings(billingPeriod, serviceType, householdId, keyword));
    }

    @PostMapping
    public ResponseEntity<UtilityReadingResponse> createReading(@Valid @RequestBody UtilityReadingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(utilityService.createReading(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UtilityReadingResponse> updateReading(
            @PathVariable Integer id,
            @Valid @RequestBody UtilityReadingRequest request) {
        return ResponseEntity.ok(utilityService.updateReading(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReading(@PathVariable Integer id) {
        utilityService.softDeleteReading(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm chỉ số tiện ích thành công"));
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate(@RequestParam(required = false) String billingPeriod) {
        String effectivePeriod = (billingPeriod != null && !billingPeriod.isBlank())
                ? billingPeriod.trim()
                : YearMonth.now().toString();
        byte[] bytes = utilityService.exportTemplate(effectivePeriod);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"mau-chi-so-dien-nuoc-" + effectivePeriod + ".xlsx\"")
                .contentType(MediaType.parseMediaType(XLSX_CONTENT_TYPE))
                .body(bytes);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UtilityImportResultResponse> importExcel(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(utilityService.importFromExcel(file));
    }
}
