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

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
public class ResidentController {

    private final ResidentService residentService;

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<Resident>> getResidentsByApartment(@PathVariable Integer apartmentId) {
        return ResponseEntity.ok(residentService.getResidentsByApartment(apartmentId));
    }

    @PostMapping
    public ResponseEntity<Resident> addResident(@Valid @RequestBody ResidentRequest request) {
        return ResponseEntity.ok(residentService.addResident(request));
    }

    @PostMapping("/residency-log")
    public ResponseEntity<ResidencyLog> recordResidencyLog(@Valid @RequestBody ResidencyLogRequest request) {
        return ResponseEntity.ok(residentService.recordResidencyLog(request));
    }
}
