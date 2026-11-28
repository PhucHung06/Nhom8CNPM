package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.FeeItemRequest;
import com.hust.se.bluemoon.dto.FeeItemResponse;
import com.hust.se.bluemoon.entity.FeeItem;
import com.hust.se.bluemoon.entity.FeeType;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.FeeItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FeeService {

    private final FeeItemRepository feeItemRepository;

    @Transactional(readOnly = true)
    public List<FeeItemResponse> searchFees(String keyword, FeeType feeType, Boolean isActive) {
        return feeItemRepository.searchFees(keyword, feeType, isActive)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeeItemResponse getFeeById(Integer id) {
        FeeItem fee = feeItemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy khoản thu có ID: " + id));
        return toResponse(fee);
    }

    @Transactional
    @LogAudit(action = "CREATE_FEE_ITEM", targetTable = "fee_items")
    public FeeItemResponse createFee(FeeItemRequest request) {
        String normalizedName = request.getFeeName().trim();
        Optional<FeeItem> existingOpt = feeItemRepository.findByFeeNameIgnoreCase(normalizedName);

        if (existingOpt.isPresent()) {
            FeeItem existing = existingOpt.get();
            if (!Boolean.TRUE.equals(existing.getIsDeleted())) {
                throw BusinessException.conflict("Tên khoản thu '" + normalizedName + "' đã tồn tại");
            }
            // Khôi phục bản ghi đã xóa mềm để không vướng ràng buộc UNIQUE(fee_name)
            existing.setFeeName(normalizedName);
            existing.setFeeType(request.getFeeType());
            existing.setUnitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP));
            existing.setUnit(request.getUnit());
            existing.setDescription(trimNullable(request.getDescription()));
            existing.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
            existing.setIsDeleted(false);
            return toResponse(feeItemRepository.save(existing));
        }

        FeeItem fee = FeeItem.builder()
                .feeName(normalizedName)
                .feeType(request.getFeeType())
                .unitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                .unit(request.getUnit())
                .description(trimNullable(request.getDescription()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isDeleted(false)
                .build();

        return toResponse(feeItemRepository.save(fee));
    }

    @Transactional
    @LogAudit(action = "UPDATE_FEE_ITEM", targetTable = "fee_items")
    public FeeItemResponse updateFee(Integer id, FeeItemRequest request) {
        FeeItem fee = feeItemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy khoản thu có ID: " + id));

        String normalizedName = request.getFeeName().trim();
        if (feeItemRepository.existsByFeeNameIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedName, id)) {
            throw BusinessException.conflict("Tên khoản thu '" + normalizedName + "' đã được sử dụng");
        }
        Optional<FeeItem> conflictSoftDeleted = feeItemRepository.findByFeeNameIgnoreCase(normalizedName);
        if (conflictSoftDeleted.isPresent() && !conflictSoftDeleted.get().getId().equals(id)) {
            throw BusinessException.conflict("Tên khoản thu '" + normalizedName + "' đã tồn tại trong lịch sử hệ thống");
        }

        fee.setFeeName(normalizedName);
        fee.setFeeType(request.getFeeType());
        fee.setUnitPrice(request.getUnitPrice().setScale(2, RoundingMode.HALF_UP));
        fee.setUnit(request.getUnit());
        fee.setDescription(trimNullable(request.getDescription()));
        if (request.getIsActive() != null) {
            fee.setIsActive(request.getIsActive());
        }

        return toResponse(feeItemRepository.save(fee));
    }

    @Transactional
    @LogAudit(action = "SOFT_DELETE_FEE_ITEM", targetTable = "fee_items")
    public void softDeleteFee(Integer id) {
        FeeItem fee = feeItemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy khoản thu có ID: " + id));

        fee.setIsDeleted(true);
        fee.setIsActive(false);
        feeItemRepository.save(fee);
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private FeeItemResponse toResponse(FeeItem f) {
        return FeeItemResponse.builder()
                .id(f.getId())
                .feeName(f.getFeeName())
                .feeType(f.getFeeType().name())
                .unitPrice(f.getUnitPrice())
                .unit(f.getUnit().name())
                .description(f.getDescription())
                .isActive(f.getIsActive())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
