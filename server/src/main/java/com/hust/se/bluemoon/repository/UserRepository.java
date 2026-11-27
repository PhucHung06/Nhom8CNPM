package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.ApprovalStatus;
import com.hust.se.bluemoon.entity.Role;
import com.hust.se.bluemoon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByIdAndIsDeletedFalse(Integer id);

    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByEmailAndIsDeletedFalse(String email);

    boolean existsByUsernameAndIsDeletedFalse(String username);

    boolean existsByEmailAndIsDeletedFalse(String email);

    List<User> findByHouseholdIdAndIsDeletedFalse(Integer householdId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.household h LEFT JOIN FETCH h.apartment " +
            "WHERE u.isDeleted = false " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:role IS NULL OR u.role = :role) " +
            "AND (:approvalStatus IS NULL OR u.approvalStatus = :approvalStatus) " +
            "ORDER BY u.createdAt DESC")
    List<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("role") Role role,
            @Param("approvalStatus") ApprovalStatus approvalStatus);
}
