package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.ResidenceStatus;
import com.hust.se.bluemoon.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Integer> {

    Optional<Resident> findByIdAndIsDeletedFalse(Integer id);

    List<Resident> findByHouseholdIdAndIsDeletedFalseAndIsActiveTrueOrderByCreatedAtAsc(Integer householdId);

    long countByHouseholdIdAndIsDeletedFalseAndIsActiveTrue(Integer householdId);

    boolean existsByCccdNumberAndIsDeletedFalseAndIsActiveTrue(String cccdNumber);

    boolean existsByCccdNumberAndIdNotAndIsDeletedFalseAndIsActiveTrue(String cccdNumber, Integer id);

    @Query("SELECT r FROM Resident r JOIN FETCH r.household h JOIN FETCH h.apartment a " +
            "WHERE r.isDeleted = false AND r.isActive = true " +
            "AND (:householdId IS NULL OR h.id = :householdId) " +
            "AND (:status IS NULL OR r.residenceStatus = :status) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(r.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "COALESCE(r.cccdNumber, '') LIKE CONCAT('%', :keyword, '%') OR " +
            "LOWER(a.apartmentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY a.apartmentCode ASC, r.createdAt ASC")
    List<Resident> searchResidents(
            @Param("householdId") Integer householdId,
            @Param("status") ResidenceStatus status,
            @Param("keyword") String keyword);
}
