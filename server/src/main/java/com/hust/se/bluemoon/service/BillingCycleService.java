package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.BillingCycleRequest;
import com.hust.se.bluemoon.dto.BillingCycleResponse;
import com.hust.se.bluemoon.dto.GenerateInvoicesResponse;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingCycleService {

    private final BillingCycleRepository billingCycleRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentRepository residentRepository;
    private final FeeItemRepository feeItemRepository;
    private final UtilityReadingRepository utilityReadingRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public BigDecimal calculateFeeAmount(
            FeeUnit unit,
            BigDecimal unitPrice,
            double area,
            long activeResidentCount) {
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw BusinessException.badRequest("Đơn giá khoản thu không hợp lệ");
        }
        return switch (unit) {
            case M2 -> unitPrice.multiply(BigDecimal.valueOf(area)).setScale(2, RoundingMode.HALF_UP);
            case PERSON -> unitPrice.multiply(BigDecimal.valueOf(activeResidentCount)).setScale(2, RoundingMode.HALF_UP);
            case HOUSEHOLD -> unitPrice.setScale(2, RoundingMode.HALF_UP);
        };
    }

    @Transactional(readOnly = true)
    public List<BillingCycleResponse> getAllCycles() {
        return billingCycleRepository.findByIsDeletedFalseOrderByBillingPeriodDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @LogAudit(action = "CREATE_BILLING_CYCLE", targetTable = "billing_cycles")
    public BillingCycleResponse createBillingCycle(BillingCycleRequest request) {
        String period = request.getBillingPeriod().trim();
        if (billingCycleRepository.existsByBillingPeriodAndIsDeletedFalse(period)) {
            throw BusinessException.conflict("Đợt thu cho kỳ '" + period + "' đã tồn tại");
        }

        User current = authService.getCurrentAuthenticatedUser();
        User creator = userRepository.findByIdAndIsDeletedFalse(current.getId())
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản người tạo"));

        BillingCycle cycle = BillingCycle.builder()
                .cycleName(request.getCycleName().trim())
                .billingPeriod(period)
                .dueDate(request.getDueDate())
                .status(BillingCycleStatus.OPEN)
                .createdBy(creator)
                .isDeleted(false)
                .build();

        return toResponse(billingCycleRepository.save(cycle));
    }

    @Transactional
    @LogAudit(action = "GENERATE_INVOICES", targetTable = "invoices")
    public GenerateInvoicesResponse generateInvoices(Integer cycleId) {
        BillingCycle cycle = billingCycleRepository.findByIdAndIsDeletedFalse(cycleId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy đợt thu có ID: " + cycleId));

        if (cycle.getStatus() == BillingCycleStatus.CLOSED) {
            throw BusinessException.badRequest("Đợt thu kỳ " + cycle.getBillingPeriod() + " đã đóng (CLOSED), không thể sinh thêm hóa đơn");
        }

        List<Household> activeHouseholds = householdRepository.findActiveHouseholdsWithApartment();
        List<FeeItem> mandatoryFees = feeItemRepository
                .findByFeeTypeAndIsActiveTrueAndIsDeletedFalseOrderByIdAsc(FeeType.MANDATORY);

        int createdCount = 0;
        int skippedCount = 0;
        BigDecimal totalGeneratedAmount = BigDecimal.ZERO;

        for (Household household : activeHouseholds) {
            if (invoiceRepository.existsByHouseholdIdAndBillingPeriodAndIsDeletedFalse(
                    household.getId(), cycle.getBillingPeriod())) {
                skippedCount++;
                continue;
            }

            long residentCount = residentRepository.countByHouseholdIdAndIsDeletedFalseAndIsActiveTrue(household.getId());
            double area = household.getApartment().getArea();

            Invoice invoice = Invoice.builder()
                    .invoiceCode(buildInvoiceCode(cycle.getBillingPeriod(), household.getId()))
                    .billingCycle(cycle)
                    .household(household)
                    .billingPeriod(cycle.getBillingPeriod())
                    .status(InvoiceStatus.UNPAID)
                    .isDeleted(false)
                    .items(new ArrayList<>())
                    .build();

            BigDecimal serviceFeeTotal = BigDecimal.ZERO;
            for (FeeItem fee : mandatoryFees) {
                BigDecimal quantity = switch (fee.getUnit()) {
                    case M2 -> BigDecimal.valueOf(area).setScale(2, RoundingMode.HALF_UP);
                    case PERSON -> BigDecimal.valueOf(residentCount).setScale(2, RoundingMode.HALF_UP);
                    case HOUSEHOLD -> BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);
                };
                BigDecimal amount = calculateFeeAmount(fee.getUnit(), fee.getUnitPrice(), area, residentCount);

                InvoiceItem item = InvoiceItem.builder()
                        .invoice(invoice)
                        .itemName(fee.getFeeName())
                        .itemType(InvoiceItemType.FEE)
                        .quantity(quantity)
                        .unit(fee.getUnit().name())
                        .unitPrice(fee.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                        .amount(amount)
                        .build();
                invoice.getItems().add(item);
                serviceFeeTotal = serviceFeeTotal.add(amount);
            }

            BigDecimal utilityFeeTotal = BigDecimal.ZERO;
            List<UtilityReading> readings = utilityReadingRepository
                    .findByHouseholdIdAndBillingPeriodAndIsDeletedFalseOrderByServiceTypeAsc(
                            household.getId(), cycle.getBillingPeriod());
            for (UtilityReading r : readings) {
                InvoiceItem item = InvoiceItem.builder()
                        .invoice(invoice)
                        .itemName(getUtilityDisplayName(r.getServiceType()))
                        .itemType(InvoiceItemType.UTILITY)
                        .quantity(r.getUsageAmount().setScale(2, RoundingMode.HALF_UP))
                        .unit(getUtilityUnit(r.getServiceType()))
                        .unitPrice(r.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                        .amount(r.getTotalAmount().setScale(2, RoundingMode.HALF_UP))
                        .build();
                invoice.getItems().add(item);
                utilityFeeTotal = utilityFeeTotal.add(r.getTotalAmount());
            }

            BigDecimal totalAmount = serviceFeeTotal.add(utilityFeeTotal).setScale(2, RoundingMode.HALF_UP);
            invoice.setServiceFeeTotal(serviceFeeTotal.setScale(2, RoundingMode.HALF_UP));
            invoice.setUtilityFeeTotal(utilityFeeTotal.setScale(2, RoundingMode.HALF_UP));
            invoice.setTotalAmount(totalAmount);

            invoiceRepository.save(invoice);
            createdCount++;
            totalGeneratedAmount = totalGeneratedAmount.add(totalAmount);
        }

        return GenerateInvoicesResponse.builder()
                .billingCycleId(cycle.getId())
                .billingPeriod(cycle.getBillingPeriod())
                .totalActiveHouseholds(activeHouseholds.size())
                .createdCount(createdCount)
                .skippedCount(skippedCount)
                .totalGeneratedAmount(totalGeneratedAmount.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    @Transactional
    @LogAudit(action = "CLOSE_BILLING_CYCLE", targetTable = "billing_cycles")
    public BillingCycleResponse closeBillingCycle(Integer cycleId) {
        BillingCycle cycle = billingCycleRepository.findByIdAndIsDeletedFalse(cycleId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy đợt thu có ID: " + cycleId));

        if (cycle.getStatus() == BillingCycleStatus.CLOSED) {
            throw BusinessException.badRequest("Đợt thu kỳ " + cycle.getBillingPeriod() + " đã được đóng trước đó");
        }

        cycle.setStatus(BillingCycleStatus.CLOSED);
        cycle.setClosedAt(LocalDateTime.now());
        return toResponse(billingCycleRepository.save(cycle));
    }

    private String buildInvoiceCode(String billingPeriod, Integer householdId) {
        return "INV-" + billingPeriod.replace("-", "") + "-" + String.format("%04d", householdId);
    }

    private String getUtilityDisplayName(UtilityServiceType type) {
        return switch (type) {
            case ELECTRICITY -> "Tiền điện sinh hoạt";
            case WATER -> "Tiền nước sinh hoạt";
            case INTERNET -> "Cước Internet";
        };
    }

    private String getUtilityUnit(UtilityServiceType type) {
        return switch (type) {
            case ELECTRICITY -> "KWH";
            case WATER -> "M3";
            case INTERNET -> "MONTH";
        };
    }

    private BillingCycleResponse toResponse(BillingCycle cycle) {
        List<Invoice> cycleInvoices = invoiceRepository.findByBillingCycleIdAndIsDeletedFalseOrderByIdAsc(cycle.getId());
        long paidCount = cycleInvoices.stream().filter(i -> i.getStatus() == InvoiceStatus.PAID).count();
        long unpaidCount = cycleInvoices.size() - paidCount;
        BigDecimal totalAmount = cycleInvoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal paidAmount = cycleInvoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return BillingCycleResponse.builder()
                .id(cycle.getId())
                .cycleName(cycle.getCycleName())
                .billingPeriod(cycle.getBillingPeriod())
                .dueDate(cycle.getDueDate())
                .status(cycle.getStatus().name())
                .closedAt(cycle.getClosedAt())
                .createdByName(cycle.getCreatedBy() != null ? cycle.getCreatedBy().getFullName() : null)
                .invoiceCount(cycleInvoices.size())
                .paidCount(paidCount)
                .unpaidCount(unpaidCount)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .createdAt(cycle.getCreatedAt())
                .build();
    }
}
