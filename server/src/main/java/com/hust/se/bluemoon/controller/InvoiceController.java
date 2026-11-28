package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.CashPaymentRequest;
import com.hust.se.bluemoon.dto.InvoiceResponse;
import com.hust.se.bluemoon.entity.InvoiceStatus;
import com.hust.se.bluemoon.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> searchInvoices(
            @RequestParam(required = false) Integer householdId,
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(invoiceService.searchInvoices(householdId, billingPeriod, status, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.getInvoiceDetail(id));
    }

    @PutMapping("/{id}/pay-cash")
    public ResponseEntity<InvoiceResponse> confirmCashPayment(
            @PathVariable Integer id,
            @Valid @RequestBody(required = false) CashPaymentRequest request) {
        return ResponseEntity.ok(invoiceService.confirmCashPayment(id, request));
    }
}
