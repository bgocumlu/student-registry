package com.studentregistry.service;

import com.studentregistry.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface TeacherService {
    List<Teacher> getAllTeachers();

    Optional<Teacher> getTeacherById(Long id);

    Teacher saveTeacher(Teacher teacher, String username);

    Teacher updateTeacher(Long id, Teacher teacherDetails, String username);

    void deleteTeacher(Long id, String username);

    List<Teacher> getTeachersByDepartment(String department);

    Optional<Teacher> getTeacherByEmail(String email);

    Optional<Teacher> getTeacherByUserId(Long userId);

    List<Teacher> searchTeachersByName(String name);

    boolean existsByEmail(String email);

    void assignUser(Long teacherId, Long userId, String username);

    void revokeUser(Long teacherId, String username);

    Page<Teacher> getFilteredTeachers(String name, String department, Pageable pageable);
}
