package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.ResidentRequest;
import com.hust.se.bluemoon.dto.ResidentResponse;
import com.hust.se.bluemoon.entity.Household;
import com.hust.se.bluemoon.entity.HouseholdStatus;
import com.hust.se.bluemoon.entity.ResidenceStatus;
import com.hust.se.bluemoon.entity.Resident;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.HouseholdRepository;
import com.hust.se.bluemoon.repository.ResidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final HouseholdRepository householdRepository;

    @Transactional(readOnly = true)
    public List<ResidentResponse> searchResidents(Integer householdId, ResidenceStatus status, String keyword) {
        return residentRepository.searchResidents(householdId, status, keyword)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ResidentResponse> getResidentsByHousehold(Integer householdId) {
        return residentRepository
                .findByHouseholdIdAndIsDeletedFalseAndIsActiveTrueOrderByCreatedAtAsc(householdId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @LogAudit(action = "ADD_RESIDENT", targetTable = "residents")
    public ResidentResponse addResident(ResidentRequest request) {
        Household household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));

        if (household.getStatus() != HouseholdStatus.ACTIVE) {
            throw BusinessException.badRequest("Chỉ được thêm nhân khẩu vào hộ gia đình đang cư trú (ACTIVE)");
        }

        String cccd = normalizeCccd(request.getCccdNumber());
        if (cccd != null && residentRepository.existsByCccdNumberAndIsDeletedFalseAndIsActiveTrue(cccd)) {
            throw BusinessException.conflict("Số CCCD/CMND '" + cccd + "' đã tồn tại trên hệ thống");
        }

        Resident resident = Resident.builder()
                .household(household)
                .fullName(request.getFullName().trim())
                .dob(request.getDob())
                .gender(request.getGender().trim())
                .cccdNumber(cccd)
                .relationshipWithOwner(request.getRelationshipWithOwner().trim())
                .residenceStatus(request.getResidenceStatus() != null
                        ? request.getResidenceStatus()
                        : ResidenceStatus.THUONG_TRU)
                .isActive(true)
                .isDeleted(false)
                .build();

        return toResponse(residentRepository.save(resident));
    }

    @Transactional
    @LogAudit(action = "UPDATE_RESIDENT", targetTable = "residents")
    public ResidentResponse updateResident(Integer id, ResidentRequest request) {
        Resident resident = residentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Nhân khẩu không tồn tại"));

        Household household = householdRepository.findByIdAndIsDeletedFalse(request.getHouseholdId())
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));

        String cccd = normalizeCccd(request.getCccdNumber());
        if (cccd != null && residentRepository.existsByCccdNumberAndIdNotAndIsDeletedFalseAndIsActiveTrue(cccd, id)) {
            throw BusinessException.conflict("Số CCCD/CMND '" + cccd + "' đã thuộc về nhân khẩu khác");
        }

        resident.setHousehold(household);
        resident.setFullName(request.getFullName().trim());
        resident.setDob(request.getDob());
        resident.setGender(request.getGender().trim());
        resident.setCccdNumber(cccd);
        resident.setRelationshipWithOwner(request.getRelationshipWithOwner().trim());
        if (request.getResidenceStatus() != null) {
            resident.setResidenceStatus(request.getResidenceStatus());
        }

        return toResponse(residentRepository.save(resident));
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_RESIDENT", targetTable = "residents")
    public void softDeleteResident(Integer id) {
        Resident resident = residentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Nhân khẩu không tồn tại"));
        resident.setIsActive(false);
        resident.setIsDeleted(true);
        residentRepository.save(resident);
    }

    private String normalizeCccd(String rawCccd) {
        return StringUtils.hasText(rawCccd) ? rawCccd.trim() : null;
    }

    public ResidentResponse toResponse(Resident r) {
        return ResidentResponse.builder()
                .id(r.getId())
                .householdId(r.getHousehold().getId())
                .apartmentId(r.getHousehold().getApartment().getId())
                .apartmentCode(r.getHousehold().getApartment().getApartmentCode())
                .headName(r.getHousehold().getHeadName())
                .fullName(r.getFullName())
                .dob(r.getDob())
                .gender(r.getGender())
                .cccdNumber(r.getCccdNumber())
                .relationshipWithOwner(r.getRelationshipWithOwner())
                .residenceStatus(r.getResidenceStatus().name())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
