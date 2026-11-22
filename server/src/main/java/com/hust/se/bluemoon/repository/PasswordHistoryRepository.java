// FILE: server/src/main/java/com/hust/se/bluemoon/repository/PasswordHistoryRepository.java
package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Integer> {

    // Lấy 3 mật khẩu gần nhất của user để kiểm tra không trùng lặp khi đổi định kỳ
    List<PasswordHistory> findTop3ByUserIdOrderByChangedAtDesc(Integer userId);
}