package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.*;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.ApartmentRepository;
import com.hust.se.bluemoon.repository.HouseholdRepository;
import com.hust.se.bluemoon.repository.ResidentRepository;
import com.hust.se.bluemoon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ApartmentRepository apartmentRepository;
    private final ResidentRepository residentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<HouseholdResponse> searchHouseholds(String keyword, HouseholdStatus status) {
        return householdRepository.searchHouseholds(keyword, status)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getHouseholdById(Integer id) {
        Household household = householdRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hộ gia đình có ID: " + id));
        return toResponse(household);
    }

    @Transactional
    @LogAudit(action = "MOVE_IN_HOUSEHOLD", targetTable = "households")
    public HouseholdResponse moveIn(MoveInRequest request) {
        Apartment apartment = apartmentRepository.findByIdAndIsDeletedFalse(request.getApartmentId())
                .orElseThrow(() -> BusinessException.notFound("Căn hộ không tồn tại"));

        if (apartment.getStatus() != ApartmentStatus.AVAILABLE
                || householdRepository.existsByApartmentIdAndStatusAndIsDeletedFalse(apartment.getId(), HouseholdStatus.ACTIVE)) {
            throw BusinessException.conflict("Căn hộ " + apartment.getApartmentCode() + " hiện không trống (không ở trạng thái AVAILABLE)");
        }

        String headCccd = request.getHeadCccd().trim();
        if (residentRepository.existsByCccdNumberAndIsDeletedFalseAndIsActiveTrue(headCccd)) {
            throw BusinessException.conflict("Số CCCD chủ hộ '" + headCccd + "' đã tồn tại trên hệ thống");
        }

        Household household = Household.builder()
                .apartment(apartment)
                .headName(request.getHeadName().trim())
                .headCccd(headCccd)
                .phone(request.getPhone().trim())
                .moveInDate(request.getMoveInDate() != null ? request.getMoveInDate() : LocalDate.now())
                .status(HouseholdStatus.ACTIVE)
                .isDeleted(false)
                .build();

        Household saved = householdRepository.save(household);

        apartment.setStatus(ApartmentStatus.OCCUPIED);
        apartmentRepository.save(apartment);

        LocalDate headDob = request.getHeadDob() != null ? request.getHeadDob() : LocalDate.of(1990, 1, 1);
        String headGender = (request.getHeadGender() != null && !request.getHeadGender().isBlank())
                ? request.getHeadGender().trim()
                : "Nam";

        Resident headResident = Resident.builder()
                .household(saved)
                .fullName(saved.getHeadName())
                .dob(headDob)
                .gender(headGender)
                .cccdNumber(saved.getHeadCccd())
                .relationshipWithOwner("Chủ hộ")
                .residenceStatus(ResidenceStatus.THUONG_TRU)
                .isActive(true)
                .isDeleted(false)
                .build();
        residentRepository.save(headResident);

        return toResponse(saved);
    }

    @Transactional
    @LogAudit(action = "UPDATE_HOUSEHOLD", targetTable = "households")
    public HouseholdResponse updateHousehold(Integer id, HouseholdUpdateRequest request) {
        Household household = householdRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));

        household.setHeadName(request.getHeadName().trim());
        household.setHeadCccd(request.getHeadCccd().trim());
        household.setPhone(request.getPhone().trim());

        return toResponse(householdRepository.save(household));
    }

    @Transactional
    @LogAudit(action = "MOVE_OUT_HOUSEHOLD", targetTable = "households")
    public HouseholdResponse moveOut(Integer id, MoveOutRequest request) {
        Household household = householdRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));

        if (household.getStatus() != HouseholdStatus.ACTIVE) {
            throw BusinessException.badRequest("Hộ gia đình này đã chuyển đi trước đó");
        }

        LocalDate moveOutDate = (request != null && request.getMoveOutDate() != null)
                ? request.getMoveOutDate()
                : LocalDate.now();
        if (moveOutDate.isBefore(household.getMoveInDate())) {
            throw BusinessException.badRequest("Ngày chuyển đi không được trước ngày chuyển đến");
        }

        household.setStatus(HouseholdStatus.MOVED_OUT);
        household.setMoveOutDate(moveOutDate);
        Household saved = householdRepository.save(household);

        Apartment apartment = household.getApartment();
        apartment.setStatus(ApartmentStatus.AVAILABLE);
        apartmentRepository.save(apartment);

        // Chuyển trạng thái các nhân khẩu của hộ sang ngừng cư trú
        List<Resident> members = residentRepository.findByHouseholdIdAndIsDeletedFalseAndIsActiveTrueOrderByCreatedAtAsc(id);
        for (Resident member : members) {
            member.setIsActive(false);
        }
        residentRepository.saveAll(members);

        // Gỡ liên kết hộ cho các tài khoản cư dân
        List<User> linkedUsers = userRepository.findByHouseholdIdAndIsDeletedFalse(id);
        for (User u : linkedUsers) {
            u.setHousehold(null);
        }
        userRepository.saveAll(linkedUsers);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getLinkedAccounts(Integer householdId) {
        householdRepository.findByIdAndIsDeletedFalse(householdId)
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));
        return userRepository.findByHouseholdIdAndIsDeletedFalse(householdId)
                .stream()
                .map(AuthService::toSummary)
                .toList();
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_HOUSEHOLD", targetTable = "households")
    public void softDeleteHousehold(Integer id) {
        Household household = householdRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Hộ gia đình không tồn tại"));

        if (household.getStatus() == HouseholdStatus.ACTIVE) {
            throw BusinessException.badRequest("Không thể xóa hộ gia đình đang cư trú (ACTIVE). Hãy thực hiện Move-out trước.");
        }
        household.setIsDeleted(true);
        householdRepository.save(household);
    }

    private HouseholdResponse toResponse(Household h) {
        long residentCount = residentRepository.countByHouseholdIdAndIsDeletedFalseAndIsActiveTrue(h.getId());
        long accountCount = userRepository.findByHouseholdIdAndIsDeletedFalse(h.getId()).size();

        return HouseholdResponse.builder()
                .id(h.getId())
                .apartmentId(h.getApartment().getId())
                .apartmentCode(h.getApartment().getApartmentCode())
                .floor(h.getApartment().getFloor())
                .area(h.getApartment().getArea())
                .headName(h.getHeadName())
                .headCccd(h.getHeadCccd())
                .phone(h.getPhone())
                .moveInDate(h.getMoveInDate())
                .moveOutDate(h.getMoveOutDate())
                .status(h.getStatus().name())
                .residentCount(residentCount)
                .linkedAccountCount(accountCount)
                .createdAt(h.getCreatedAt())
                .build();
    }
}
