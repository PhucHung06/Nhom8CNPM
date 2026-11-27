package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.*;
import com.hust.se.bluemoon.entity.HouseholdStatus;
import com.hust.se.bluemoon.service.HouseholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class HouseholdController {

    private final HouseholdService householdService;

    @GetMapping
    public ResponseEntity<List<HouseholdResponse>> getHouseholds(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) HouseholdStatus status) {
        return ResponseEntity.ok(householdService.searchHouseholds(keyword, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HouseholdResponse> getHouseholdById(@PathVariable Integer id) {
        return ResponseEntity.ok(householdService.getHouseholdById(id));
    }

    @PostMapping("/move-in")
    public ResponseEntity<HouseholdResponse> moveIn(@Valid @RequestBody MoveInRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(householdService.moveIn(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HouseholdResponse> updateHousehold(
            @PathVariable Integer id,
            @Valid @RequestBody HouseholdUpdateRequest request) {
        return ResponseEntity.ok(householdService.updateHousehold(id, request));
    }

    @PutMapping("/{id}/move-out")
    public ResponseEntity<HouseholdResponse> moveOut(
            @PathVariable Integer id,
            @RequestBody(required = false) MoveOutRequest request) {
        return ResponseEntity.ok(householdService.moveOut(id, request));
    }

    @GetMapping("/{id}/accounts")
    public ResponseEntity<List<UserSummaryResponse>> getLinkedAccounts(@PathVariable Integer id) {
        return ResponseEntity.ok(householdService.getLinkedAccounts(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> softDeleteHousehold(@PathVariable Integer id) {
        householdService.softDeleteHousehold(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm hộ gia đình thành công"));
    }
}
