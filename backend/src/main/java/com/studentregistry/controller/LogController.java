package com.studentregistry.controller;

import com.studentregistry.entity.Log;
import com.studentregistry.service.LogService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import com.studentregistry.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    @Operation(summary = "Get filtered logs with pagination")
    public PaginatedResponse<Log> getAllLogs(
            @Parameter(description = "Filter by action type") @RequestParam(required = false) String action,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by course ID (not implemented - for API compatibility)") @RequestParam(required = false) Long courseId,
            @Parameter(description = "Filter by student ID (not implemented - for API compatibility)") @RequestParam(required = false) Long studentId,
            @Parameter(description = "Filter from date (ISO format: 2025-01-01T00:00:00)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @Parameter(description = "Filter to date (ISO format: 2025-01-01T23:59:59)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "id"));
        Page<Log> logs = logService.getFilteredLogs(action, userId, courseId, studentId, dateFrom, dateTo, pageable);
        return PaginatedResponse.fromPage(logs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(@PathVariable Long id) {
        return logService.getLogById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Log createLog(@RequestBody Log log) {
        return logService.saveLog(log);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        try {
            logService.deleteLog(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    public List<Log> getLogsByUser(@PathVariable Long userId) {
        return logService.getLogsByUser(userId);
    }

    @GetMapping("/action/{action}")
    public List<Log> getLogsByAction(@PathVariable String action) {
        return logService.getLogsByAction(action);
    }

    @GetMapping("/timestamp-range")
    public List<Log> getLogsByTimestampRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return logService.getLogsByTimestampRange(startDate, endDate);
    }

    @GetMapping("/user/{userId}/timestamp-range")
    public List<Log> getLogsByUserAndTimestampRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return logService.getLogsByUserAndTimestampRange(userId, startDate, endDate);
    }
}