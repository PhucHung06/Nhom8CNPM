package com.hust.se.bluemoon.service;

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
    public Apartment createApartment(ApartmentRequest request) {
        if (apartmentRepository.existsByApartmentCode(request.getApartmentCode())) {
            throw new RuntimeException("Mã căn hộ '" + request.getApartmentCode() + "' đã tồn tại trong tòa nhà");
        }

        Apartment apartment = Apartment.builder()
                .apartmentCode(request.getApartmentCode().trim().toUpperCase())
                .floor(request.getFloor())
                .area(request.getArea())
                .ownerName(request.getOwnerName().trim())
                .ownerPhone(request.getOwnerPhone().trim())
                .build();

        return apartmentRepository.save(apartment);
    }
}
