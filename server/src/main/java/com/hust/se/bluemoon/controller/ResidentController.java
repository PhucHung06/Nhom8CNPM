package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ResidencyLogRequest;
import com.hust.se.bluemoon.dto.ResidentRequest;
import com.hust.se.bluemoon.entity.ResidencyLog;
import com.hust.se.bluemoon.entity.Resident;
import com.hust.se.bluemoon.service.ResidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
public class ResidentController {

    private final ResidentService residentService;

    @GetMapping
    public ResponseEntity<List<Resident>> getAllResidents() {
        return ResponseEntity.ok(residentService.getAllActiveResidents());
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<Resident>> getResidentsByApartment(@PathVariable Integer apartmentId) {
        return ResponseEntity.ok(residentService.getResidentsByApartment(apartmentId));
    }

    @PostMapping
    public ResponseEntity<Resident> addResident(@Valid @RequestBody ResidentRequest request) {
        return ResponseEntity.ok(residentService.addResident(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateResident(@PathVariable Integer id) {
        residentService.deactivateResident(id);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật chuyển đi cho nhân khẩu"));
    }

    @GetMapping("/{residentId}/residency-logs")
    public ResponseEntity<List<ResidencyLog>> getResidencyLogs(@PathVariable Integer residentId) {
        return ResponseEntity.ok(residentService.getResidencyLogsByResident(residentId));
    }

    @PostMapping("/residency-log")
    public ResponseEntity<ResidencyLog> recordResidencyLog(@Valid @RequestBody ResidencyLogRequest request) {
        return ResponseEntity.ok(residentService.recordResidencyLog(request));
    }
}
