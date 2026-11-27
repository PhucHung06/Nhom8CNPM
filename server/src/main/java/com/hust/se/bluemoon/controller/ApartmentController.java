package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.dto.ApartmentResponse;
import com.hust.se.bluemoon.entity.ApartmentStatus;
import com.hust.se.bluemoon.service.ApartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ApartmentController {

    private final ApartmentService apartmentService;

    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getAllApartments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ApartmentStatus status,
            @RequestParam(required = false) Integer floor) {
        return ResponseEntity.ok(apartmentService.searchApartments(keyword, status, floor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApartmentResponse> getApartmentById(@PathVariable Integer id) {
        return ResponseEntity.ok(apartmentService.getApartmentById(id));
    }

    @PostMapping
    public ResponseEntity<ApartmentResponse> createApartment(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apartmentService.createApartment(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApartmentResponse> updateApartment(
            @PathVariable Integer id,
            @Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.ok(apartmentService.updateApartment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> softDeleteApartment(@PathVariable Integer id) {
        apartmentService.softDeleteApartment(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa mềm căn hộ thành công"));
    }
}
