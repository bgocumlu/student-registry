package com.studentregistry.repository;

import com.studentregistry.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudent_Id(Long studentId, Sort sort);
    Page<Enrollment> findByStudent_Id(Long studentId, Pageable pageable);

    List<Enrollment> findByCourse_Id(Long courseId, Sort sort);
    Page<Enrollment> findByCourse_Id(Long courseId, Pageable pageable);
    long countByCourse_Id(Long courseId);

    Optional<Enrollment> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);

    @Query("SELECT e FROM Enrollment e WHERE e.finalGrade IS NOT NULL ORDER BY e.id")
    List<Enrollment> findByFinalGradeIsNotNull();

    @Query("SELECT e FROM Enrollment e WHERE e.finalGrade IS NULL ORDER BY e.id")
    List<Enrollment> findByFinalGradeIsNull();

    @Query("SELECT e FROM Enrollment e WHERE e.course.semester = :semester ORDER BY e.id")
    List<Enrollment> findBySemester(@Param("semester") String semester);

    @Query("SELECT e FROM Enrollment e WHERE e.student.id = :studentId AND e.course.semester = :semester ORDER BY e.id")
    List<Enrollment> findByStudentAndSemester(@Param("studentId") Long studentId, @Param("semester") String semester);
}