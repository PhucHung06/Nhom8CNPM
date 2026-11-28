package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.FeeItemRequest;
import com.hust.se.bluemoon.dto.FeeItemResponse;
import com.hust.se.bluemoon.entity.FeeType;
import com.hust.se.bluemoon.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;

    @GetMapping
    public ResponseEntity<List<FeeItemResponse>> searchFees(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FeeType feeType,
            @RequestParam(required = false) Boolean isActive) {
        return ResponseEntity.ok(feeService.searchFees(keyword, feeType, isActive));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeItemResponse> getFeeById(@PathVariable Integer id) {
        return ResponseEntity.ok(feeService.getFeeById(id));
    }

    @PostMapping
    public ResponseEntity<FeeItemResponse> createFee(@Valid @RequestBody FeeItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feeService.createFee(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeItemResponse> updateFee(
            @PathVariable Integer id,
            @Valid @RequestBody FeeItemRequest request) {
        return ResponseEntity.ok(feeService.updateFee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFee(@PathVariable Integer id) {
        feeService.softDeleteFee(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm khoản thu thành công"));
    }
}
