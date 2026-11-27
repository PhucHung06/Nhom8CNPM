package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.dto.ApartmentResponse;
import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.entity.ApartmentStatus;
import com.hust.se.bluemoon.entity.Household;
import com.hust.se.bluemoon.entity.HouseholdStatus;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.ApartmentRepository;
import com.hust.se.bluemoon.repository.HouseholdRepository;
import com.hust.se.bluemoon.repository.ResidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;

    @Transactional(readOnly = true)
    public List<ApartmentResponse> searchApartments(String keyword, ApartmentStatus status, Integer floor) {
        return apartmentRepository.searchApartments(keyword, status, floor)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApartmentResponse getApartmentById(Integer id) {
        Apartment apartment = apartmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy căn hộ có ID: " + id));
        return toResponse(apartment);
    }

    @Transactional
    @LogAudit(action = "CREATE_APARTMENT", targetTable = "apartments")
    public ApartmentResponse createApartment(ApartmentRequest request) {
        String code = request.getApartmentCode().trim().toUpperCase();
        if (apartmentRepository.existsByApartmentCodeAndIsDeletedFalse(code)) {
            throw BusinessException.conflict("Mã căn hộ '" + code + "' đã tồn tại trong tòa nhà");
        }

        Apartment apartment = Apartment.builder()
                .apartmentCode(code)
                .floor(request.getFloor())
                .area(request.getArea())
                .status(request.getStatus() != null ? request.getStatus() : ApartmentStatus.AVAILABLE)
                .isDeleted(false)
                .build();

        return toResponse(apartmentRepository.save(apartment));
    }

    @Transactional
    @LogAudit(action = "UPDATE_APARTMENT", targetTable = "apartments")
    public ApartmentResponse updateApartment(Integer id, ApartmentRequest request) {
        Apartment apartment = apartmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy căn hộ có ID: " + id));

        String newCode = request.getApartmentCode().trim().toUpperCase();
        if (apartmentRepository.existsByApartmentCodeAndIdNotAndIsDeletedFalse(newCode, id)) {
            throw BusinessException.conflict("Mã căn hộ '" + newCode + "' đã được sử dụng");
        }

        apartment.setApartmentCode(newCode);
        apartment.setFloor(request.getFloor());
        apartment.setArea(request.getArea());
        if (request.getStatus() != null) {
            boolean hasActiveHousehold = householdRepository
                    .existsByApartmentIdAndStatusAndIsDeletedFalse(id, HouseholdStatus.ACTIVE);
            if (request.getStatus() == ApartmentStatus.AVAILABLE && hasActiveHousehold) {
                throw BusinessException.badRequest("Căn hộ đang có hộ gia đình cư trú, hãy thực hiện Move-out trước");
            }
            apartment.setStatus(request.getStatus());
        }

        return toResponse(apartmentRepository.save(apartment));
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_APARTMENT", targetTable = "apartments")
    public void softDeleteApartment(Integer id) {
        Apartment apartment = apartmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy căn hộ có ID: " + id));

        if (apartment.getStatus() == ApartmentStatus.OCCUPIED
                || householdRepository.existsByApartmentIdAndStatusAndIsDeletedFalse(id, HouseholdStatus.ACTIVE)) {
            throw BusinessException.badRequest("Không thể xóa căn hộ đang có hộ gia đình cư trú (OCCUPIED)");
        }

        apartment.setIsDeleted(true);
        apartmentRepository.save(apartment);
    }

    private ApartmentResponse toResponse(Apartment apartment) {
        Optional<Household> activeHousehold = householdRepository
                .findByApartmentIdAndStatusAndIsDeletedFalse(apartment.getId(), HouseholdStatus.ACTIVE);

        Integer householdId = null;
        String headName = null;
        String headPhone = null;
        long residentCount = 0;

        if (activeHousehold.isPresent()) {
            Household h = activeHousehold.get();
            householdId = h.getId();
            headName = h.getHeadName();
            headPhone = h.getPhone();
            residentCount = residentRepository.countByHouseholdIdAndIsDeletedFalseAndIsActiveTrue(h.getId());
        }

        return ApartmentResponse.builder()
                .id(apartment.getId())
                .apartmentCode(apartment.getApartmentCode())
                .floor(apartment.getFloor())
                .area(apartment.getArea())
                .status(apartment.getStatus().name())
                .activeHouseholdId(householdId)
                .headName(headName)
                .headPhone(headPhone)
                .residentCount(residentCount)
                .createdAt(apartment.getCreatedAt())
                .build();
    }
}
