package com.studentregistry.controller;

import com.studentregistry.dto.CreateTeacherDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.dto.PaginatedResponse;
import com.studentregistry.dto.TeacherResponseDTO;
import com.studentregistry.entity.Teacher;
import com.studentregistry.service.TeacherService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService teacherService;
    private final DTOMapper dtoMapper;

    public TeacherController(TeacherService teacherService, DTOMapper dtoMapper) {
        this.teacherService = teacherService;
        this.dtoMapper = dtoMapper;
    }

    @GetMapping
    @Operation(summary = "Get all teachers with filtering and pagination")
    public PaginatedResponse<TeacherResponseDTO> getAllTeachers(
            @Parameter(description = "Filter by teacher name (partial match)") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by department") @RequestParam(required = false) String department,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id")); // Convert to 0-based, sorted by ID
        Page<Teacher> teachers = teacherService.getFilteredTeachers(name, department, pageable);
        Page<TeacherResponseDTO> teacherDtos = teachers.map(TeacherResponseDTO::new);
        return PaginatedResponse.fromPage(teacherDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponseDTO> getTeacherById(@PathVariable Long id) {
        return teacherService.getTeacherById(id)
                .map(teacher -> ResponseEntity.ok(new TeacherResponseDTO(teacher)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TeacherResponseDTO createTeacher(@Valid @RequestBody CreateTeacherDTO createTeacherDTO, Authentication authentication) {
        Teacher teacher = dtoMapper.toEntity(createTeacherDTO);
        String username = authentication != null ? authentication.getName() : null;
        Teacher savedTeacher = teacherService.saveTeacher(teacher, username);
        return new TeacherResponseDTO(savedTeacher);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherResponseDTO> updateTeacher(@PathVariable Long id, @RequestBody Teacher teacherDetails, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            Teacher updatedTeacher = teacherService.updateTeacher(id, teacherDetails, username);
            return ResponseEntity.ok(new TeacherResponseDTO(updatedTeacher));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            teacherService.deleteTeacher(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/department/{department}")
    public List<TeacherResponseDTO> getTeachersByDepartment(@PathVariable String department) {
        return teacherService.getTeachersByDepartment(department).stream()
                .map(TeacherResponseDTO::new)
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<TeacherResponseDTO> getTeacherByEmail(@PathVariable String email) {
        return teacherService.getTeacherByEmail(email)
                .map(teacher -> ResponseEntity.ok(new TeacherResponseDTO(teacher)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<TeacherResponseDTO> getTeacherByUserId(@PathVariable Long userId) {
        return teacherService.getTeacherByUserId(userId)
                .map(teacher -> ResponseEntity.ok(new TeacherResponseDTO(teacher)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<TeacherResponseDTO> searchTeachers(@RequestParam String name) {
        return teacherService.searchTeachersByName(name).stream()
                .map(TeacherResponseDTO::new)
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        boolean exists = teacherService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    @PostMapping("/{id}/assign-user")
    public ResponseEntity<?> assignUser(@PathVariable Long id, @RequestBody UserAssignmentRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            teacherService.assignUser(id, request.getUserId(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/revoke-user")
    public ResponseEntity<?> revokeUser(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            teacherService.revokeUser(id, username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Inner class for request body
    public static class UserAssignmentRequest {
        private Long userId;
        
        public Long getUserId() {
            return userId;
        }
        
        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }
}