package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Interger> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
