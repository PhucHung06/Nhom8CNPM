package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.ApartmentRequest;
import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.entity.ApartmentStatus;
import com.hust.se.bluemoon.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;

    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }

    public List<Apartment> searchApartments(String keyword, ApartmentStatus status, Integer floor) {
        String cleanKeyword = (keyword != null) ? keyword.trim() : null;
        return apartmentRepository.searchApartments(cleanKeyword, status, floor);
    }

    public Apartment getApartmentById(Integer id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy căn hộ có ID: " + id));
    }

    @Transactional
    @LogAudit(action = "CREATE_APARTMENT", targetTable = "apartments")
    public Apartment createApartment(ApartmentRequest request) {
        String normalizedCode = request.getApartmentCode().trim().toUpperCase();

        if (apartmentRepository.existsByApartmentCode(normalizedCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã căn hộ '" + normalizedCode + "' đã tồn tại trong tòa nhà");
        }

        double roundedArea = Math.round(request.getArea() * 100.0) / 100.0;
        if (roundedArea <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Diện tích căn hộ phải là số thực lớn hơn 0");
        }

        Apartment apartment = Apartment.builder()
                .apartmentCode(normalizedCode)
                .floor(request.getFloor())
                .area(roundedArea)
                .ownerName(request.getOwnerName().trim())
                .ownerCccd(request.getOwnerCccd() != null && !request.getOwnerCccd().isBlank()
                        ? request.getOwnerCccd().trim()
                        : null)
                .ownerPhone(request.getOwnerPhone().trim())
                .status(request.getStatus() != null ? request.getStatus() : ApartmentStatus.OCCUPIED)
                .build();

        return apartmentRepository.save(apartment);
    }

    @Transactional
    @LogAudit(action = "UPDATE_APARTMENT", targetTable = "apartments")
    public Apartment updateApartment(Integer id, ApartmentRequest request) {
        Apartment apartment = getApartmentById(id);
        String normalizedCode = request.getApartmentCode().trim().toUpperCase();

        if (apartmentRepository.existsByApartmentCodeAndIdNot(normalizedCode, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Mã căn hộ '" + normalizedCode + "' đã tồn tại ở một căn hộ khác trong tòa nhà");
        }

        double roundedArea = Math.round(request.getArea() * 100.0) / 100.0;
        if (roundedArea <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Diện tích căn hộ phải là số thực lớn hơn 0");
        }

        apartment.setApartmentCode(normalizedCode);
        apartment.setFloor(request.getFloor());
        apartment.setArea(roundedArea);
        apartment.setOwnerName(request.getOwnerName().trim());
        apartment.setOwnerCccd(request.getOwnerCccd() != null && !request.getOwnerCccd().isBlank()
                ? request.getOwnerCccd().trim()
                : null);
        apartment.setOwnerPhone(request.getOwnerPhone().trim());
        if (request.getStatus() != null) {
            apartment.setStatus(request.getStatus());
        }

        return apartmentRepository.save(apartment);
    }

    @Transactional
    @LogAudit(action = "DELETE_APARTMENT", targetTable = "apartments")
    public void deleteApartment(Integer id) {
        Apartment apartment = getApartmentById(id);
        apartmentRepository.delete(apartment);
    }
}