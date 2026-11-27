package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.Household;
import com.hust.se.bluemoon.entity.HouseholdStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Integer> {

    Optional<Household> findByIdAndIsDeletedFalse(Integer id);

    Optional<Household> findByApartmentIdAndStatusAndIsDeletedFalse(Integer apartmentId, HouseholdStatus status);

    boolean existsByApartmentIdAndStatusAndIsDeletedFalse(Integer apartmentId, HouseholdStatus status);

    @Query("SELECT h FROM Household h JOIN FETCH h.apartment a WHERE h.isDeleted = false " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(h.headName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "h.headCccd LIKE CONCAT('%', :keyword, '%') OR " +
            "h.phone LIKE CONCAT('%', :keyword, '%') OR " +
            "LOWER(a.apartmentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:status IS NULL OR h.status = :status) " +
            "ORDER BY h.status ASC, a.floor ASC, a.apartmentCode ASC")
    List<Household> searchHouseholds(@Param("keyword") String keyword, @Param("status") HouseholdStatus status);
}
