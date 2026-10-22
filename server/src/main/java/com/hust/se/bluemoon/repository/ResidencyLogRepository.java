package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.ResidencyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResidencyLogRepository extends JpaRepository<ResidencyLog, Integer> {
    List<ResidencyLog> findByResidentIdOrderByCreatedAtDesc(Integer residentId);
}
