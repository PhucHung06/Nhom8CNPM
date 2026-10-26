package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Integer> {
    List<Resident> findByApartmentIdAndIsActiveTrue(Integer apartmentId);
    Optional<Resident> findByCccdNumberAndIsActiveTrue(String cccdNumber);
    boolean existsByCccdNumberAndIsActiveTrue(String cccdNumber);
}
