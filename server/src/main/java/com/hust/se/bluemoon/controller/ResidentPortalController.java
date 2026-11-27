package com.hust.se.bluemoon.controller;

import com.hust.se.bluemoon.dto.HouseholdResponse;
import com.hust.se.bluemoon.dto.ResidentResponse;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.repository.UserRepository;
import com.hust.se.bluemoon.service.AuthService;
import com.hust.se.bluemoon.service.HouseholdService;
import com.hust.se.bluemoon.service.ResidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
