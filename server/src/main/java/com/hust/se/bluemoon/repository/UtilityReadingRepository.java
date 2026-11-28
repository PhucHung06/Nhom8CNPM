package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.UtilityReading;
import com.hust.se.bluemoon.entity.UtilityServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilityReadingRepository extends JpaRepository<UtilityReading, Integer> {

    Optional<UtilityReading> findByIdAndIsDeletedFalse(Integer id);

    Optional<UtilityReading> findByHouseholdIdAndBillingPeriodAndServiceType(
            Integer householdId, String billingPeriod, UtilityServiceType serviceType);

    List<UtilityReading> findByHouseholdIdAndBillingPeriodAndIsDeletedFalseOrderByServiceTypeAsc(
            Integer householdId, String billingPeriod);

    Optional<UtilityReading> findTopByHouseholdIdAndServiceTypeAndIsDeletedFalseOrderByBillingPeriodDesc(
            Integer householdId, UtilityServiceType serviceType);

    @Query("SELECT r FROM UtilityReading r JOIN FETCH r.household h JOIN FETCH h.apartment a " +
            "WHERE r.isDeleted = false " +
            "AND (:billingPeriod IS NULL OR :billingPeriod = '' OR r.billingPeriod = :billingPeriod) " +
            "AND (:serviceType IS NULL OR r.serviceType = :serviceType) " +
            "AND (:householdId IS NULL OR h.id = :householdId) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(a.apartmentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(h.headName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY r.billingPeriod DESC, a.apartmentCode ASC, r.serviceType ASC")
    List<UtilityReading> searchReadings(
            @Param("billingPeriod") String billingPeriod,
            @Param("serviceType") UtilityServiceType serviceType,
            @Param("householdId") Integer householdId,
            @Param("keyword") String keyword);
}
