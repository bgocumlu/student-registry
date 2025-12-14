package com.studentregistry.service.impl;

import com.studentregistry.entity.Teacher;
import com.studentregistry.entity.User;
import com.studentregistry.repository.TeacherRepository;
import com.studentregistry.repository.UserRepository;
import com.studentregistry.service.LogService;
import com.studentregistry.service.TeacherService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public TeacherServiceImpl(TeacherRepository teacherRepository, UserRepository userRepository,
            LogService logService) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll(Sort.by("id"));
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }

    public Teacher saveTeacher(Teacher teacher, String username) {
        Teacher saved = teacherRepository.save(teacher);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "teacherId", saved.getId(),
                    "name", saved.getFirstName() + " " + saved.getLastName(),
                    "department", saved.getDepartment() != null ? saved.getDepartment() : "",
                    "email", saved.getEmail() != null ? saved.getEmail() : ""));
            logService.logActionByUsername(username, "CREATE_TEACHER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return saved;
    }

    public Teacher updateTeacher(Long id, Teacher teacherDetails, String username) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + id));

        String oldName = teacher.getFirstName() + " " + teacher.getLastName();

        teacher.setFirstName(teacherDetails.getFirstName());
        teacher.setLastName(teacherDetails.getLastName());
        teacher.setDepartment(teacherDetails.getDepartment());
        teacher.setEmail(teacherDetails.getEmail());
        teacher.setPhone(teacherDetails.getPhone());
        // Only update user if explicitly provided (not null)
        if (teacherDetails.getUser() != null) {
            teacher.setUser(teacherDetails.getUser());
        }

        Teacher updated = teacherRepository.save(teacher);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "teacherId", updated.getId(),
                    "oldName", oldName,
                    "newName", updated.getFirstName() + " " + updated.getLastName(),
                    "department", updated.getDepartment() != null ? updated.getDepartment() : ""));
            logService.logActionByUsername(username, "UPDATE_TEACHER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return updated;
    }

    public void deleteTeacher(Long id, String username) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(id);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            try {
                String details = objectMapper.writeValueAsString(Map.of(
                        "teacherId", teacher.getId(),
                        "name", teacher.getFirstName() + " " + teacher.getLastName()));
                logService.logActionByUsername(username, "DELETE_TEACHER", details);
            } catch (Exception e) {
                // Logging failure shouldn't break the operation
            }
        }
        teacherRepository.deleteById(id);
    }

    public List<Teacher> getTeachersByDepartment(String department) {
        return teacherRepository.findByDepartment(department, Sort.by("id"));
    }

    public Optional<Teacher> getTeacherByEmail(String email) {
        return teacherRepository.findByEmail(email);
    }

    public Optional<Teacher> getTeacherByUserId(Long userId) {
        return teacherRepository.findByUser_Id(userId);
    }

    public List<Teacher> searchTeachersByName(String name) {
        return teacherRepository.findByNameContaining(name);
    }

    public boolean existsByEmail(String email) {
        return teacherRepository.existsByEmail(email);
    }

    public void assignUser(Long teacherId, Long userId, String username) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is already assigned to another teacher
        if (teacherRepository.existsByUser_Id(userId)) {
            throw new RuntimeException("User is already assigned to another teacher");
        }

        teacher.setUser(user);
        teacherRepository.save(teacher);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "teacherId", teacherId,
                    "teacherName", teacher.getFirstName() + " " + teacher.getLastName(),
                    "userId", userId,
                    "userEmail", user.getEmail()));
            logService.logActionByUsername(username, "ASSIGN_USER_TO_TEACHER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
    }

    public void revokeUser(Long teacherId, String username) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Long userId = teacher.getUser() != null ? teacher.getUser().getId() : null;
        teacher.setUser(null);
        teacherRepository.save(teacher);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "teacherId", teacherId,
                    "teacherName", teacher.getFirstName() + " " + teacher.getLastName(),
                    "userId", userId != null ? userId : "null"));
            logService.logActionByUsername(username, "REVOKE_USER_FROM_TEACHER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
    }

    public Page<Teacher> getFilteredTeachers(String name, String department, Pageable pageable) {
        return teacherRepository.findFilteredTeachers(name, department, pageable);
    }
}