package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.EmailOtp;
import com.hust.se.bluemoon.entity.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);

    @Modifying
    @Query("UPDATE EmailOtp o SET o.used = true WHERE o.email = :email AND o.purpose = :purpose AND o.used = false")
    void invalidateActiveOtps(@Param("email") String email, @Param("purpose") OtpPurpose purpose);
}
