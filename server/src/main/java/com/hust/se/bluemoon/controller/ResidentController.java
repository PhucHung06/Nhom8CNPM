package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ResidentRequest;
import com.hust.se.bluemoon.dto.ResidentResponse;
import com.hust.se.bluemoon.entity.ResidenceStatus;
import com.hust.se.bluemoon.service.ResidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ResidentController {

    private final ResidentService residentService;

    @GetMapping
    public ResponseEntity<List<ResidentResponse>> getResidents(
            @RequestParam(required = false) Integer householdId,
            @RequestParam(required = false) ResidenceStatus status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(residentService.searchResidents(householdId, status, keyword));
    }

    @GetMapping("/household/{householdId}")
    public ResponseEntity<List<ResidentResponse>> getResidentsByHousehold(@PathVariable Integer householdId) {
        return ResponseEntity.ok(residentService.getResidentsByHousehold(householdId));
    }

    @PostMapping
    public ResponseEntity<ResidentResponse> addResident(@Valid @RequestBody ResidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(residentService.addResident(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResidentResponse> updateResident(
            @PathVariable Integer id,
            @Valid @RequestBody ResidentRequest request) {
        return ResponseEntity.ok(residentService.updateResident(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> softDeleteResident(@PathVariable Integer id) {
        residentService.softDeleteResident(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm nhân khẩu thành công"));
    }
}
