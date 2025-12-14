package com.studentregistry.controller;

import com.studentregistry.dto.CreateCourseDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.dto.PaginatedResponse;
import com.studentregistry.entity.Course;
import com.studentregistry.entity.Enrollment;
import com.studentregistry.entity.Absence;
import com.studentregistry.service.CourseService;
import com.studentregistry.service.EnrollmentService;
import com.studentregistry.service.AbsenceService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final DTOMapper dtoMapper;
    private final EnrollmentService enrollmentService;
    private final AbsenceService absenceService;

    public CourseController(CourseService courseService, DTOMapper dtoMapper,
                          EnrollmentService enrollmentService, AbsenceService absenceService) {
        this.courseService = courseService;
        this.dtoMapper = dtoMapper;
        this.enrollmentService = enrollmentService;
        this.absenceService = absenceService;
    }

    @GetMapping
    @Operation(summary = "Get all courses with filtering and pagination")
    public PaginatedResponse<Course> getAllCourses(
            @Parameter(description = "Filter by course name (partial match)") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by department") @RequestParam(required = false) String department,
            @Parameter(description = "Filter by semester") @RequestParam(required = false) String semester,
            @Parameter(description = "Filter by teacher ID") @RequestParam(required = false) Long teacherId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id")); // Convert to 0-based, sorted by ID
        Page<Course> courses = courseService.getFilteredCourses(name, department, semester, teacherId, pageable);
        return PaginatedResponse.fromPage(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Course createCourse(@Valid @RequestBody CreateCourseDTO createCourseDTO, Authentication authentication) {
        Course course = dtoMapper.toEntity(createCourseDTO);
        String username = authentication != null ? authentication.getName() : null;
        return courseService.saveCourse(course, username);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @Valid @RequestBody CreateCourseDTO updateCourseDTO, Authentication authentication) {
        try {
            Course courseDetails = dtoMapper.toEntity(updateCourseDTO);
            String username = authentication != null ? authentication.getName() : null;
            Course updatedCourse = courseService.updateCourse(id, courseDetails, username);
            return ResponseEntity.ok(updatedCourse);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            courseService.deleteCourse(id, username);
            return ResponseEntity.ok().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Course has enrollments or absences that prevent deletion
            return ResponseEntity.badRequest()
                .body("Cannot delete course: It has associated enrollments or absences. Please remove them first.");
        } catch (RuntimeException e) {
            // Course not found or other runtime exception
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Other exceptions
            return ResponseEntity.badRequest().body("Failed to delete course: " + e.getMessage());
        }
    }

    @GetMapping("/semester/{semester}")
    public List<Course> getCoursesBySemester(@PathVariable String semester) {
        return courseService.getCoursesBySemester(semester);
    }

    @GetMapping("/department/{department}")
    public List<Course> getCoursesByDepartment(@PathVariable String department) {
        return courseService.getCoursesByDepartment(department);
    }

    @GetMapping("/status/{status}")
    public List<Course> getCoursesByStatus(@PathVariable Course.Status status) {
        return courseService.getCoursesByStatus(status);
    }

    @GetMapping("/teacher/{teacherId}")
    public List<Course> getCoursesByTeacher(@PathVariable Long teacherId) {
        return courseService.getCoursesByTeacher(teacherId);
    }

    @GetMapping("/offering")
    public ResponseEntity<Course> getCourseOffering(
            @RequestParam String courseCode,
            @RequestParam String semester,
            @RequestParam String section) {
        return courseService.getCourseByCodeSemesterSection(courseCode, semester, section)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Course> searchCourses(@RequestParam String searchTerm) {
        return courseService.searchCourses(searchTerm);
    }

    @GetMapping("/{id}/enrollments")
    @Operation(summary = "Get course enrollments with pagination")
    public ResponseEntity<PaginatedResponse<Enrollment>> getCourseEnrollments(
            @PathVariable Long id,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id")); // Convert to 0-based, sorted by ID
        Page<Enrollment> enrollments = enrollmentService.getEnrollmentsByCourseId(id, pageable);
        return ResponseEntity.ok(PaginatedResponse.fromPage(enrollments));
    }

    @GetMapping("/{id}/absences")
    @Operation(summary = "Get course absences with pagination")
    public ResponseEntity<PaginatedResponse<Absence>> getCourseAbsences(
            @PathVariable Long id,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("student.id", "date")); // Convert to 0-based, sorted by ID
        Page<Absence> absences = absenceService.getAbsencesByCourseId(id, pageable);
        return ResponseEntity.ok(PaginatedResponse.fromPage(absences));
    }

    @PutMapping("/{courseId}/students/{studentId}/grade")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> updateStudentGrade(
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            @RequestBody GradeUpdateRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            enrollmentService.updateGrade(studentId, courseId, request.getFinalGrade(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{courseId}/absences")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> addAbsenceRecord(
            @PathVariable Long courseId,
            @RequestBody AbsenceRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            absenceService.addAbsence(request.getStudentId(), courseId, request.getDate(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{courseId}/absences")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<?> removeAbsenceRecord(
            @PathVariable Long courseId,
            @RequestBody AbsenceRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            absenceService.removeAbsence(request.getStudentId(), courseId, request.getDate(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Inner class for grade update request
    public static class GradeUpdateRequest {
        private String finalGrade;
        
        public String getFinalGrade() {
            return finalGrade;
        }
        
        public void setFinalGrade(String finalGrade) {
            this.finalGrade = finalGrade;
        }
    }

    // Inner class for absence request
    public static class AbsenceRequest {
        private Long studentId;
        private String date; // ISO date string
        
        public Long getStudentId() {
            return studentId;
        }
        
        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }
        
        public String getDate() {
            return date;
        }
        
        public void setDate(String date) {
            this.date = date;
        }
    }
}