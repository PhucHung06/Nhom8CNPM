package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.BillingCycle;
import com.hust.se.bluemoon.entity.BillingCycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillingCycleRepository extends JpaRepository<BillingCycle, Integer> {

    Optional<BillingCycle> findByIdAndIsDeletedFalse(Integer id);

    Optional<BillingCycle> findByBillingPeriodAndIsDeletedFalse(String billingPeriod);

    boolean existsByBillingPeriodAndIsDeletedFalse(String billingPeriod);

    boolean existsByBillingPeriodAndStatusAndIsDeletedFalse(String billingPeriod, BillingCycleStatus status);

    List<BillingCycle> findByIsDeletedFalseOrderByBillingPeriodDesc();
}
