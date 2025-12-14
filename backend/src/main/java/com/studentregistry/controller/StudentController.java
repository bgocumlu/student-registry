package com.studentregistry.controller;

import com.studentregistry.dto.CreateStudentDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.entity.Student;
import com.studentregistry.entity.Enrollment;
import com.studentregistry.entity.Absence;
import com.studentregistry.service.StudentService;
import com.studentregistry.service.EnrollmentService;
import com.studentregistry.service.AbsenceService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import com.studentregistry.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final DTOMapper dtoMapper;
    private final EnrollmentService enrollmentService;
    private final AbsenceService absenceService;

    public StudentController(StudentService studentService, DTOMapper dtoMapper, 
                           EnrollmentService enrollmentService, AbsenceService absenceService) {
        this.studentService = studentService;
        this.dtoMapper = dtoMapper;
        this.enrollmentService = enrollmentService;
        this.absenceService = absenceService;
    }

    @GetMapping
    @Operation(summary = "Get all students with filtering and pagination")
    public PaginatedResponse<Student> getAllStudents(
            @Parameter(description = "Filter by student name (partial match)") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by department") @RequestParam(required = false) String department,
            @Parameter(description = "Filter by enrollment year") @RequestParam(required = false) Integer enrollmentYear,
            @Parameter(description = "Filter by student status (active, graduated, suspended)") @RequestParam(required = false) String status,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        // Convert string status to enum, handling null and invalid values
        // The enum values are: ACTIVE, GRADUATED, INACTIVE, DROPPED
        // But they map to lowercase strings: "active", "graduated", "inactive", "dropped"
        Student.Status statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                // Try direct enum name first (uppercase)
                statusEnum = Student.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // If that fails, try to find by the string value
                for (Student.Status s : Student.Status.values()) {
                    if (s.name().equalsIgnoreCase(status) || s.getValue().equalsIgnoreCase(status)) {
                        statusEnum = s;
                        break;
                    }
                }
                // If still not found, invalid status value will be ignored (statusEnum remains null)
            }
        }
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id")); // Convert to 0-based, sorted by ID
        Page<Student> students = studentService.getFilteredStudents(name, department, enrollmentYear, statusEnum, pageable);
        return PaginatedResponse.fromPage(students);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Student createStudent(@Valid @RequestBody CreateStudentDTO createStudentDTO, Authentication authentication) {
        Student student = dtoMapper.toEntity(createStudentDTO);
        String username = authentication != null ? authentication.getName() : null;
        return studentService.saveStudent(student, username);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @Valid @RequestBody CreateStudentDTO updateStudentDTO, Authentication authentication) {
        try {
            Student studentDetails = dtoMapper.toEntity(updateStudentDTO);
            String username = authentication != null ? authentication.getName() : null;
            Student updatedStudent = studentService.updateStudent(id, studentDetails, username);
            return ResponseEntity.ok(updatedStudent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            studentService.deleteStudent(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status/{status}")
    public List<Student> getStudentsByStatus(@PathVariable Student.Status status) {
        return studentService.getStudentsByStatus(status);
    }

    @GetMapping("/department/{department}")
    public List<Student> getStudentsByDepartment(@PathVariable String department) {
        return studentService.getStudentsByDepartment(department);
    }

    @GetMapping("/enrollment-year/{year}")
    public List<Student> getStudentsByEnrollmentYear(@PathVariable int year) {
        return studentService.getStudentsByEnrollmentYear(year);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Student> getStudentByEmail(@PathVariable String email) {
        return studentService.getStudentByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Student> searchStudents(@RequestParam String name) {
        return studentService.searchStudentsByName(name);
    }

    @GetMapping("/{id}/enrollments")
    @Operation(summary = "Get student enrollments with pagination")
    public ResponseEntity<PaginatedResponse<Enrollment>> getStudentEnrollments(
            @PathVariable Long id,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id"));
        Page<Enrollment> enrollments = enrollmentService.getEnrollmentsByStudentId(id, pageable);
        return ResponseEntity.ok(PaginatedResponse.fromPage(enrollments));
    }

    @GetMapping("/{id}/absences")
    @Operation(summary = "Get student absences with pagination")
    public ResponseEntity<PaginatedResponse<Absence>> getStudentAbsences(
            @PathVariable Long id,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("student.id", "course.id", "date"));
        Page<Absence> absences = absenceService.getAbsencesByStudentId(id, pageable);
        return ResponseEntity.ok(PaginatedResponse.fromPage(absences));
    }
}