package com.studentregistry.service;

import com.studentregistry.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface StudentService {
    List<Student> getAllStudents();

    Optional<Student> getStudentById(Long id);

    Student saveStudent(Student student, String username);

    Student updateStudent(Long id, Student studentDetails, String username);

    void deleteStudent(Long id, String username);

    List<Student> getStudentsByStatus(Student.Status status);

    List<Student> getStudentsByDepartment(String department);

    List<Student> getStudentsByEnrollmentYear(int year);

    Optional<Student> getStudentByEmail(String email);

    List<Student> searchStudentsByName(String name);

    Page<Student> getFilteredStudents(String name, String department, Integer enrollmentYear,
            Student.Status status, Pageable pageable);
}
