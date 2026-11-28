package com.hust.se.bluemoon.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "utility_readings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_utility_household_period_type",
                        columnNames = {"household_id", "billing_period", "service_type"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Household household;

    @Column(name = "billing_period", nullable = false, length = 7)
    private String billingPeriod;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 20)
    private UtilityServiceType serviceType;

    @Column(name = "old_index", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal oldIndex = BigDecimal.ZERO;

    @Column(name = "new_index", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal newIndex = BigDecimal.ZERO;

    @Column(name = "usage_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal usageAmount = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
