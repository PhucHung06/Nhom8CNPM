package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.dto.ResidencyLogRequest;
import com.hust.se.bluemoon.dto.ResidentRequest;
import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.entity.ResidenceStatus;
import com.hust.se.bluemoon.entity.ResidencyLog;
import com.hust.se.bluemoon.entity.Resident;
import com.hust.se.bluemoon.repository.ApartmentRepository;
import com.hust.se.bluemoon.repository.ResidencyLogRepository;
import com.hust.se.bluemoon.repository.ResidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final ApartmentRepository apartmentRepository;
    private final ResidencyLogRepository residencyLogRepository;

    public List<Resident> getResidentsByApartment(Integer apartmentId) {
        return residentRepository.findByApartmentIdAndIsActiveTrue(apartmentId);
    }

    @Transactional
    public Resident addResident(ResidentRequest request) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new RuntimeException("Căn hộ không tồn tại"));

        // Ràng buộc UC004: Kiểm tra chặn trùng số CCCD trên toàn tòa nhà
        if (request.getCccdNumber() != null && !request.getCccdNumber().isBlank()) {
            if (residentRepository.existsByCccdNumberAndIsActiveTrue(request.getCccdNumber())) {
                throw new RuntimeException("Số CCCD '" + request.getCccdNumber() + "' đã được đăng ký cho một cư dân khác trong tòa nhà");
            }
        }

        Resident resident = Resident.builder()
                .apartment(apartment)
                .fullName(request.getFullName().trim())
                .dob(request.getDob())
                .gender(request.getGender())
                .cccdNumber(request.getCccdNumber() != null && !request.getCccdNumber().isBlank() ? request.getCccdNumber().trim() : null)
                .relationshipWithOwner(request.getRelationshipWithOwner())
                .residenceStatus(ResidenceStatus.THUONG_TRU)
                .build();

        return residentRepository.save(resident);
    }

    @Transactional
    public ResidencyLog recordResidencyLog(ResidencyLogRequest request) {
        Resident resident = residentRepository.findById(request.getResidentId())
                .orElseThrow(() -> new RuntimeException("Nhân khẩu không tồn tại"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("Ngày kết thúc phải diễn ra sau hoặc cùng ngày bắt đầu");
        }

        // Cập nhật trạng thái cư trú hiện tại của nhân khẩu
        resident.setResidenceStatus(request.getLogType());
        residentRepository.save(resident);

        ResidencyLog log = ResidencyLog.builder()
                .resident(resident)
                .logType(request.getLogType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .build();

        return residencyLogRepository.save(log);
    }
}
