package com.studentregistry.service;

import com.studentregistry.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface EnrollmentService {
    List<Enrollment> getAllEnrollments();

    Optional<Enrollment> getEnrollmentById(Long id);

    Enrollment saveEnrollment(Enrollment enrollment, String username);

    Enrollment updateEnrollment(Long id, Enrollment enrollmentDetails);

    void deleteEnrollment(Long id);

    List<Enrollment> getEnrollmentsByStudent(Long studentId);

    List<Enrollment> getEnrollmentsByCourse(Long courseId);

    Optional<Enrollment> getEnrollmentByStudentAndCourse(Long studentId, Long courseId);

    List<Enrollment> getEnrollmentsBySemester(String semester);

    List<Enrollment> getEnrollmentsByStudentAndSemester(Long studentId, String semester);

    List<Enrollment> getGradedEnrollments();

    List<Enrollment> getUngradedEnrollments();

    Page<Enrollment> getEnrollmentsByStudentId(Long studentId, Pageable pageable);

    Page<Enrollment> getEnrollmentsByCourseId(Long courseId, Pageable pageable);

    void removeEnrollment(Long studentId, Long courseId, String username);

    void updateGrade(Long studentId, Long courseId, String finalGrade, String username);
}
