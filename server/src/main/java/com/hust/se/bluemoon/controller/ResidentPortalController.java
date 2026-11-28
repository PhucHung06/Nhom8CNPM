package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.HouseholdResponse;
import com.hust.se.bluemoon.dto.InvoiceResponse;
import com.hust.se.bluemoon.dto.ResidentResponse;
import com.hust.se.bluemoon.dto.UtilityReadingResponse;
import com.hust.se.bluemoon.entity.InvoiceStatus;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.entity.UtilityServiceType;
import com.hust.se.bluemoon.repository.UserRepository;
import com.hust.se.bluemoon.service.AuthService;
import com.hust.se.bluemoon.service.HouseholdService;
import com.hust.se.bluemoon.service.InvoiceService;
import com.hust.se.bluemoon.service.ResidentService;
import com.hust.se.bluemoon.service.UtilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resident")
@RequiredArgsConstructor
public class ResidentPortalController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final HouseholdService householdService;
    private final ResidentService residentService;
    private final UtilityService utilityService;
    private final InvoiceService invoiceService;

    @GetMapping("/my-household")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getMyHousehold() {
        User current = authService.getCurrentAuthenticatedUser();
        User user = userRepository.findByIdAndIsDeletedFalse(current.getId()).orElseThrow();

        Map<String, Object> result = new LinkedHashMap<>();
        if (user.getHousehold() == null) {
            result.put("assigned", false);
            result.put("household", null);
            result.put("residents", List.of());
            return ResponseEntity.ok(result);
        }

        Integer householdId = user.getHousehold().getId();
        HouseholdResponse household = householdService.getHouseholdById(householdId);
        List<ResidentResponse> residents = residentService.getResidentsByHousehold(householdId);

        result.put("assigned", true);
        result.put("household", household);
        result.put("residents", residents);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/utilities")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UtilityReadingResponse>> getMyUtilities(
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(required = false) UtilityServiceType serviceType) {
        Integer householdId = resolveCurrentHouseholdId();
        return ResponseEntity.ok(utilityService.getResidentUtilities(householdId, billingPeriod, serviceType));
    }

    @GetMapping("/invoices")
    @Transactional(readOnly = true)
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(
            @RequestParam(required = false) String billingPeriod,
            @RequestParam(required = false) InvoiceStatus status) {
        Integer householdId = resolveCurrentHouseholdId();
        return ResponseEntity.ok(invoiceService.getResidentInvoices(householdId, billingPeriod, status));
    }

    @GetMapping("/invoices/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<InvoiceResponse> getMyInvoiceDetail(@PathVariable Integer id) {
        Integer householdId = resolveCurrentHouseholdId();
        return ResponseEntity.ok(invoiceService.getResidentInvoiceDetail(householdId, id));
    }

    private Integer resolveCurrentHouseholdId() {
        User current = authService.getCurrentAuthenticatedUser();
        User user = userRepository.findByIdAndIsDeletedFalse(current.getId()).orElseThrow();
        return user.getHousehold() != null ? user.getHousehold().getId() : null;
    }
}
