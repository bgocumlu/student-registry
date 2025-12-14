package com.studentregistry.controller;

import com.studentregistry.dto.CreateEnrollmentDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.entity.Enrollment;
import com.studentregistry.service.EnrollmentService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final DTOMapper dtoMapper;

    public EnrollmentController(EnrollmentService enrollmentService, DTOMapper dtoMapper) {
        this.enrollmentService = enrollmentService;
        this.dtoMapper = dtoMapper;
    }

    @GetMapping
    public List<Enrollment> getAllEnrollments() {
        return enrollmentService.getAllEnrollments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Enrollment> getEnrollmentById(@PathVariable Long id) {
        return enrollmentService.getEnrollmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Enrollment> createEnrollment(@Valid @RequestBody CreateEnrollmentDTO createEnrollmentDTO, Authentication authentication) {
        try {
            Enrollment enrollment = dtoMapper.toEntity(createEnrollmentDTO);
            String username = authentication != null ? authentication.getName() : null;
            Enrollment savedEnrollment = enrollmentService.saveEnrollment(enrollment, username);
            return ResponseEntity.ok(savedEnrollment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Enrollment> updateEnrollment(@PathVariable Long id,
            @RequestBody Enrollment enrollmentDetails) {
        try {
            Enrollment updatedEnrollment = enrollmentService.updateEnrollment(id, enrollmentDetails);
            return ResponseEntity.ok(updatedEnrollment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEnrollment(@PathVariable Long id) {
        try {
            enrollmentService.deleteEnrollment(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/student/{studentId}")
    public List<Enrollment> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return enrollmentService.getEnrollmentsByStudent(studentId);
    }

    @GetMapping("/course/{courseId}")
    public List<Enrollment> getEnrollmentsByCourse(@PathVariable Long courseId) {
        return enrollmentService.getEnrollmentsByCourse(courseId);
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<Enrollment> getEnrollmentByStudentAndCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        return enrollmentService.getEnrollmentByStudentAndCourse(studentId, courseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/semester/{semester}")
    public List<Enrollment> getEnrollmentsBySemester(@PathVariable String semester) {
        return enrollmentService.getEnrollmentsBySemester(semester);
    }

    @GetMapping("/student/{studentId}/semester/{semester}")
    public List<Enrollment> getEnrollmentsByStudentAndSemester(
            @PathVariable Long studentId,
            @PathVariable String semester) {
        return enrollmentService.getEnrollmentsByStudentAndSemester(studentId, semester);
    }

    @GetMapping("/graded")
    public List<Enrollment> getGradedEnrollments() {
        return enrollmentService.getGradedEnrollments();
    }

    @GetMapping("/ungraded")
    public List<Enrollment> getUngradedEnrollments() {
        return enrollmentService.getUngradedEnrollments();
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeEnrollment(@RequestBody EnrollmentRemovalRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            enrollmentService.removeEnrollment(request.getStudentId(), request.getCourseId(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Inner class for request body
    public static class EnrollmentRemovalRequest {
        private Long studentId;
        private Long courseId;
        
        public Long getStudentId() {
            return studentId;
        }
        
        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }
        
        public Long getCourseId() {
            return courseId;
        }
        
        public void setCourseId(Long courseId) {
            this.courseId = courseId;
        }
    }
}