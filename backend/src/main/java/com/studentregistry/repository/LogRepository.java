package com.studentregistry.repository;

import com.studentregistry.entity.Log;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<Log, Long>, JpaSpecificationExecutor<Log> {

    List<Log> findByUser_Id(Long userId, Sort sort);

    List<Log> findByAction(String action, Sort sort);

    @Query("SELECT l FROM Log l WHERE l.timestamp BETWEEN :startDate AND :endDate ORDER BY l.id DESC")
    List<Log> findByTimestampRange(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT l FROM Log l WHERE l.user.id = :userId AND l.timestamp BETWEEN :startDate AND :endDate ORDER BY l.id DESC")
    List<Log> findByUserAndTimestampRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Removed findFilteredLogs - now using Specification in LogService instead
    // This avoids PostgreSQL type inference issues with IS NULL checks
}