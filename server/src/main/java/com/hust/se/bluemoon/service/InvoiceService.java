package com.hust.se.bluemoon.service;

import com.hust.se.bluemoon.aspect.LogAudit;
import com.hust.se.bluemoon.dto.CashPaymentRequest;
import com.hust.se.bluemoon.dto.InvoiceItemResponse;
import com.hust.se.bluemoon.dto.InvoiceResponse;
import com.hust.se.bluemoon.entity.*;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.repository.InvoiceRepository;
import com.hust.se.bluemoon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<InvoiceResponse> searchInvoices(
            Integer householdId,
            String billingPeriod,
            InvoiceStatus status,
            String keyword) {
        return invoiceRepository.searchInvoices(householdId, billingPeriod, status, keyword)
                .stream()
                .map(i -> toResponse(i, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByCycle(Integer cycleId) {
        return invoiceRepository.findByBillingCycleIdAndIsDeletedFalseOrderByIdAsc(cycleId)
                .stream()
                .map(i -> toResponse(i, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceDetail(Integer id) {
        Invoice invoice = invoiceRepository.findDetailById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hóa đơn có ID: " + id));
        return toResponse(invoice, true);
    }

    @Transactional
    @LogAudit(action = "CONFIRM_CASH_PAYMENT", targetTable = "invoices")
    public InvoiceResponse confirmCashPayment(Integer id, CashPaymentRequest request) {
        Invoice invoice = invoiceRepository.findDetailById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hóa đơn có ID: " + id));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw BusinessException.conflict("Hóa đơn '" + invoice.getInvoiceCode() + "' đã được thanh toán trước đó");
        }

        User current = authService.getCurrentAuthenticatedUser();
        User collector = userRepository.findByIdAndIsDeletedFalse(current.getId())
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy thông tin người thu"));

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentMethod(PaymentMethod.CASH);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setCollectedBy(collector);
        if (request != null && request.getNote() != null && !request.getNote().trim().isEmpty()) {
            invoice.setNote(request.getNote().trim());
        }

        return toResponse(invoiceRepository.save(invoice), true);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getResidentInvoices(
            Integer householdId,
            String billingPeriod,
            InvoiceStatus status) {
        if (householdId == null) {
            return List.of();
        }
        return invoiceRepository.searchInvoices(householdId, billingPeriod, status, null)
                .stream()
                .map(i -> toResponse(i, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getResidentInvoiceDetail(Integer householdId, Integer invoiceId) {
        if (householdId == null) {
            throw BusinessException.forbidden("Tài khoản của bạn chưa được gắn với hộ gia đình nào");
        }
        Invoice invoice = invoiceRepository.findDetailById(invoiceId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy hóa đơn có ID: " + invoiceId));
        if (!invoice.getHousehold().getId().equals(householdId)) {
            throw BusinessException.forbidden("Bạn không có quyền xem hóa đơn của hộ gia đình khác");
        }
        return toResponse(invoice, true);
    }

    private InvoiceResponse toResponse(Invoice i, boolean includeItems) {
        List<InvoiceItemResponse> itemResponses = includeItems && i.getItems() != null
                ? i.getItems().stream()
                        .map(item -> InvoiceItemResponse.builder()
                                .id(item.getId())
                                .itemName(item.getItemName())
                                .itemType(item.getItemType().name())
                                .quantity(item.getQuantity())
                                .unit(item.getUnit())
                                .unitPrice(item.getUnitPrice())
                                .amount(item.getAmount())
                                .build())
                        .toList()
                : null;

        return InvoiceResponse.builder()
                .id(i.getId())
                .invoiceCode(i.getInvoiceCode())
                .billingCycleId(i.getBillingCycle().getId())
                .cycleName(i.getBillingCycle().getCycleName())
                .householdId(i.getHousehold().getId())
                .apartmentCode(i.getHousehold().getApartment().getApartmentCode())
                .headName(i.getHousehold().getHeadName())
                .headPhone(i.getHousehold().getPhone())
                .billingPeriod(i.getBillingPeriod())
                .dueDate(i.getBillingCycle().getDueDate())
                .serviceFeeTotal(i.getServiceFeeTotal())
                .utilityFeeTotal(i.getUtilityFeeTotal())
                .totalAmount(i.getTotalAmount())
                .status(i.getStatus().name())
                .paymentMethod(i.getPaymentMethod() != null ? i.getPaymentMethod().name() : null)
                .paidAt(i.getPaidAt())
                .collectedById(i.getCollectedBy() != null ? i.getCollectedBy().getId() : null)
                .collectedByName(i.getCollectedBy() != null ? i.getCollectedBy().getFullName() : null)
                .note(i.getNote())
                .createdAt(i.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
