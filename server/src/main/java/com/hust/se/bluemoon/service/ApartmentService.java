package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;

    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }

    public Apartment getApartmentById(Integer id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy căn hộ có ID: " + id));
    }

    @Transactional
    @LogAudit(action = "CREATE_APARTMENT", targetTable = "apartments")
    public Apartment createApartment(ApartmentRequest request) {
        String code = request.getApartmentCode().trim().toUpperCase();
        if (apartmentRepository.existsByApartmentCode(code)) {
            throw new RuntimeException("Mã căn hộ '" + code + "' đã tồn tại trong tòa nhà");
        }

        Apartment apartment = Apartment.builder()
                .apartmentCode(code)
                .floor(request.getFloor())
                .area(request.getArea())
                .ownerName(request.getOwnerName().trim())
                .ownerPhone(request.getOwnerPhone().trim())
                .build();

        return apartmentRepository.save(apartment);
    }

    @Transactional
    @LogAudit(action = "UPDATE_APARTMENT", targetTable = "apartments")
    public Apartment updateApartment(Integer id, ApartmentRequest request) {
        Apartment apartment = getApartmentById(id);
        String newCode = request.getApartmentCode().trim().toUpperCase();

        if (!apartment.getApartmentCode().equals(newCode) && apartmentRepository.existsByApartmentCode(newCode)) {
            throw new RuntimeException("Mã căn hộ '" + newCode + "' đã được sử dụng");
        }

        apartment.setApartmentCode(newCode);
        apartment.setFloor(request.getFloor());
        apartment.setArea(request.getArea());
        apartment.setOwnerName(request.getOwnerName().trim());
        apartment.setOwnerPhone(request.getOwnerPhone().trim());

        return apartmentRepository.save(apartment);
    }
}
