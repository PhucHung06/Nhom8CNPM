package com.hust.se.bluemoon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "residents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(name = "cccd_number", length = 12, unique = true)
    private String cccdNumber;

    @Column(name = "relationship_with_owner", nullable = false, length = 50)
    private String relationshipWithOwner;

    @Enumerated(EnumType.STRING)
    @Column(name = "residence_status", nullable = false, length = 20)
    @Builder.Default
    private ResidenceStatus residenceStatus = ResidenceStatus.THUONG_TRU;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
