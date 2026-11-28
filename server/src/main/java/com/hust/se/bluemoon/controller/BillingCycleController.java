package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.BillingCycleRequest;
import com.hust.se.bluemoon.dto.BillingCycleResponse;
import com.hust.se.bluemoon.dto.GenerateInvoicesResponse;
import com.hust.se.bluemoon.dto.InvoiceResponse;
import com.hust.se.bluemoon.service.BillingCycleService;
import com.hust.se.bluemoon.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing-cycles")
@RequiredArgsConstructor
public class BillingCycleController {

    private final BillingCycleService billingCycleService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<BillingCycleResponse>> getAllCycles() {
        return ResponseEntity.ok(billingCycleService.getAllCycles());
    }

    @PostMapping
    public ResponseEntity<BillingCycleResponse> createBillingCycle(@Valid @RequestBody BillingCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingCycleService.createBillingCycle(request));
    }

    @PostMapping("/{id}/generate-invoices")
    public ResponseEntity<GenerateInvoicesResponse> generateInvoices(@PathVariable Integer id) {
        return ResponseEntity.ok(billingCycleService.generateInvoices(id));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<BillingCycleResponse> closeBillingCycle(@PathVariable Integer id) {
        return ResponseEntity.ok(billingCycleService.closeBillingCycle(id));
    }

    @GetMapping("/{id}/invoices")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByCycle(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCycle(id));
    }
}
