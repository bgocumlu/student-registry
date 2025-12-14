package com.studentregistry.controller;

import com.studentregistry.dto.PaginatedResponse;
import com.studentregistry.entity.Absence;
import com.studentregistry.service.AbsenceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/absences")
public class AbsenceController {

    private final AbsenceService absenceService;

    public AbsenceController(AbsenceService absenceService) {
        this.absenceService = absenceService;
    }

    @GetMapping
    @Operation(summary = "Get all absences with pagination")
    public PaginatedResponse<Absence> getAllAbsences(
            @Parameter(description = "Filter by student ID") @RequestParam(required = false) Long studentId,
            @Parameter(description = "Filter by course ID") @RequestParam(required = false) Long courseId,
            @Parameter(description = "Filter from date") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @Parameter(description = "Filter to date") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("student.id", "course.id", "date"));
        Page<Absence> absences = absenceService.getFilteredAbsences(studentId, courseId, dateFrom, dateTo, pageable);
        return PaginatedResponse.fromPage(absences);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Absence createAbsence(@RequestBody Absence absence) {
        return absenceService.saveAbsence(absence);
    }

    @DeleteMapping("/student/{studentId}/course/{courseId}/date/{date}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> deleteAbsence(
            @PathVariable Long studentId,
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            Absence.AbsenceId id = new Absence.AbsenceId(studentId, courseId, date);
            absenceService.deleteAbsence(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get absences by student with pagination")
    public PaginatedResponse<Absence> getAbsencesByStudent(
            @PathVariable Long studentId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("course.id", "date"));
        Page<Absence> absences = absenceService.getAbsencesByStudent(studentId, pageable);
        return PaginatedResponse.fromPage(absences);
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get absences by course with pagination")
    public PaginatedResponse<Absence> getAbsencesByCourse(
            @PathVariable Long courseId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("student.id", "date"));
        Page<Absence> absences = absenceService.getAbsencesByCourse(courseId, pageable);
        return PaginatedResponse.fromPage(absences);
    }

    @GetMapping("/date/{date}")
    public List<Absence> getAbsencesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return absenceService.getAbsencesByDate(date);
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    public List<Absence> getAbsencesByStudentAndCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        return absenceService.getAbsencesByStudentAndCourse(studentId, courseId);
    }

    @GetMapping("/date-range")
    public List<Absence> getAbsencesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return absenceService.getAbsencesByDateRange(startDate, endDate);
    }

    @GetMapping("/count/student/{studentId}/course/{courseId}")
    public ResponseEntity<Long> countAbsencesByStudentAndCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        Long count = absenceService.countAbsencesByStudentAndCourse(studentId, courseId);
        return ResponseEntity.ok(count);
    }
}