package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.FeeItem;
import com.hust.se.bluemoon.entity.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeeItemRepository extends JpaRepository<FeeItem, Integer> {

    Optional<FeeItem> findByIdAndIsDeletedFalse(Integer id);

    Optional<FeeItem> findByFeeNameIgnoreCase(String feeName);

    boolean existsByFeeNameIgnoreCaseAndIsDeletedFalse(String feeName);

    boolean existsByFeeNameIgnoreCaseAndIdNotAndIsDeletedFalse(String feeName, Integer id);

    List<FeeItem> findByFeeTypeAndIsActiveTrueAndIsDeletedFalseOrderByIdAsc(FeeType feeType);

    @Query("SELECT f FROM FeeItem f WHERE f.isDeleted = false " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(f.feeName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(COALESCE(f.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:feeType IS NULL OR f.feeType = :feeType) " +
            "AND (:isActive IS NULL OR f.isActive = :isActive) " +
            "ORDER BY f.feeType ASC, f.id ASC")
    List<FeeItem> searchFees(
            @Param("keyword") String keyword,
            @Param("feeType") FeeType feeType,
            @Param("isActive") Boolean isActive);
}
