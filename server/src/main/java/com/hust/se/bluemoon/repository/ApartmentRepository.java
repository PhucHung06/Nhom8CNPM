package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.Apartment;
import com.hust.se.bluemoon.entity.ApartmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Integer> {
    Optional<Apartment> findByApartmentCode(String apartmentCode);

    boolean existsByApartmentCode(String apartmentCode);

    boolean existsByApartmentCodeAndIdNot(String apartmentCode, Integer id);

    @Query("SELECT a FROM Apartment a WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(a.apartmentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.ownerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "a.ownerPhone LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:floor IS NULL OR a.floor = :floor) " +
            "ORDER BY a.floor ASC, a.apartmentCode ASC")
    List<Apartment> searchApartments(
            @Param("keyword") String keyword,
            @Param("status") ApartmentStatus status,
            @Param("floor") Integer floor);
}