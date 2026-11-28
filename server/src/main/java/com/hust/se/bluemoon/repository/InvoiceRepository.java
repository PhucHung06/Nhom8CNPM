package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.Invoice;
import com.hust.se.bluemoon.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

    Optional<Invoice> findByIdAndIsDeletedFalse(Integer id);

    @Query("SELECT DISTINCT i FROM Invoice i " +
            "JOIN FETCH i.household h " +
            "JOIN FETCH h.apartment a " +
            "JOIN FETCH i.billingCycle bc " +
            "LEFT JOIN FETCH i.collectedBy cb " +
            "LEFT JOIN FETCH i.items it " +
            "WHERE i.id = :id AND i.isDeleted = false")
    Optional<Invoice> findDetailById(@Param("id") Integer id);

    boolean existsByHouseholdIdAndBillingPeriodAndIsDeletedFalse(Integer householdId, String billingPeriod);

    List<Invoice> findByBillingCycleIdAndIsDeletedFalseOrderByIdAsc(Integer billingCycleId);

    @Query("SELECT i FROM Invoice i " +
            "JOIN FETCH i.household h " +
            "JOIN FETCH h.apartment a " +
            "JOIN FETCH i.billingCycle bc " +
            "LEFT JOIN FETCH i.collectedBy cb " +
            "WHERE i.isDeleted = false " +
            "AND (:householdId IS NULL OR h.id = :householdId) " +
            "AND (:billingPeriod IS NULL OR :billingPeriod = '' OR i.billingPeriod = :billingPeriod) " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(i.invoiceCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.apartmentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(h.headName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY i.billingPeriod DESC, a.apartmentCode ASC")
    List<Invoice> searchInvoices(
            @Param("householdId") Integer householdId,
            @Param("billingPeriod") String billingPeriod,
            @Param("status") InvoiceStatus status,
            @Param("keyword") String keyword);
}
