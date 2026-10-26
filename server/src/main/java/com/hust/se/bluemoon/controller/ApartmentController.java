package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.entity.Apartment;
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
public class ApartmentController {

    private final ApartmentService apartmentService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RESIDENT_MANAGER', 'ROLE_CASHIER')")
    public ResponseEntity<List<Apartment>> getAllApartments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ApartmentStatus status,
            @RequestParam(required = false) Integer floor) {
        if ((keyword != null && !keyword.isBlank()) || status != null || floor != null) {
            return ResponseEntity.ok(apartmentService.searchApartments(keyword, status, floor));
        }
        return ResponseEntity.ok(apartmentService.getAllApartments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RESIDENT_MANAGER', 'ROLE_CASHIER')")
    public ResponseEntity<Apartment> getApartmentById(@PathVariable Integer id) {
        return ResponseEntity.ok(apartmentService.getApartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RESIDENT_MANAGER')")
    public ResponseEntity<Apartment> createApartment(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apartmentService.createApartment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RESIDENT_MANAGER')")
    public ResponseEntity<Apartment> updateApartment(
            @PathVariable Integer id,
            @Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.ok(apartmentService.updateApartment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_RESIDENT_MANAGER')")
    public ResponseEntity<Map<String, Object>> deleteApartment(@PathVariable Integer id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Xóa hồ sơ căn hộ thành công"));
    }
}