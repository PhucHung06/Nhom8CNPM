package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.service.ApartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;

    @GetMapping
    public ResponseEntity<List<Apartment>> getAllApartments() {
        return ResponseEntity.ok(apartmentService.getAllApartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Apartment> getApartmentById(@PathVariable Integer id) {
        return ResponseEntity.ok(apartmentService.getApartmentById(id));
    }

    @PostMapping
    public ResponseEntity<Apartment> createApartment(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.ok(apartmentService.createApartment(request));
    }
}
