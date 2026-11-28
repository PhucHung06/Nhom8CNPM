package com.hust.se.bluemoon;

import com.hust.se.bluemoon.entity.FeeUnit;
import com.hust.se.bluemoon.entity.UtilityServiceType;
import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.service.BillingCycleService;
import com.hust.se.bluemoon.service.UtilityService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Sprint2BillingFormulaUnitTest {

    private final BillingCycleService billingCycleService =
            new BillingCycleService(null, null, null, null, null, null, null, null);
    private final UtilityService utilityService = new UtilityService(null, null, null);

    @Test
    void calculateFeeAmountForM2PersonHousehold() {
        BigDecimal m2Amount = billingCycleService.calculateFeeAmount(
                FeeUnit.M2, new BigDecimal("12000"), 85.5, 3);
        assertThat(m2Amount).isEqualByComparingTo("1026000.00");

        BigDecimal personAmount = billingCycleService.calculateFeeAmount(
                FeeUnit.PERSON, new BigDecimal("6000"), 85.5, 3);
        assertThat(personAmount).isEqualByComparingTo("18000.00");

        BigDecimal householdAmount = billingCycleService.calculateFeeAmount(
                FeeUnit.HOUSEHOLD, new BigDecimal("50000"), 85.5, 3);
        assertThat(householdAmount).isEqualByComparingTo("50000.00");
    }

    @Test
    void calculateUtilityAmountsValidAndInvalid() {
        UtilityService.CalculatedUtility elec = utilityService.calculateUtilityAmounts(
                UtilityServiceType.ELECTRICITY,
                new BigDecimal("100"),
                new BigDecimal("250"),
                new BigDecimal("3500"));
        assertThat(elec.usageAmount()).isEqualByComparingTo("150.00");
        assertThat(elec.totalAmount()).isEqualByComparingTo("525000.00");

        assertThatThrownBy(() -> utilityService.calculateUtilityAmounts(
                UtilityServiceType.WATER,
                new BigDecimal("120"),
                new BigDecimal("120"),
                new BigDecimal("15000")))
                .isInstanceOf(BusinessException.class);

        UtilityService.CalculatedUtility internet = utilityService.calculateUtilityAmounts(
                UtilityServiceType.INTERNET,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                new BigDecimal("220000"));
        assertThat(internet.usageAmount()).isEqualByComparingTo("1.00");
        assertThat(internet.totalAmount()).isEqualByComparingTo("220000.00");
    }
}
