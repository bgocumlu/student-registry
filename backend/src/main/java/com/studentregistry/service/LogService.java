package com.studentregistry.service;

import com.studentregistry.entity.Log;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LogService {
    List<Log> getAllLogs();

    Optional<Log> getLogById(Long id);

    Log saveLog(Log log);

    void deleteLog(Long id);

    List<Log> getLogsByUser(Long userId);

    List<Log> getLogsByAction(String action);

    List<Log> getLogsByTimestampRange(LocalDateTime startDate, LocalDateTime endDate);

    List<Log> getLogsByUserAndTimestampRange(Long userId, LocalDateTime startDate, LocalDateTime endDate);

    void logAction(Long userId, String action, String details);

    void logActionByUsername(String username, String action, String details);

    Page<Log> getFilteredLogs(String action, Long userId, Long courseId, Long studentId,
            LocalDateTime dateFrom, LocalDateTime dateTo, Pageable pageable);
}
