package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Integer> {
    Optional<Apartment> findByApartmentCode(String apartmentCode);
    boolean existsByApartmentCode(String apartmentCode);
}
