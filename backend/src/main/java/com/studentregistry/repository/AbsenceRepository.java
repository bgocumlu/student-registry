package com.studentregistry.repository;

import com.studentregistry.entity.Absence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Absence.AbsenceId> {

    List<Absence> findByStudent_Id(Long studentId, Sort sort);
    Page<Absence> findByStudent_Id(Long studentId, Pageable pageable);

    List<Absence> findByCourse_Id(Long courseId, Sort sort);
    Page<Absence> findByCourse_Id(Long courseId, Pageable pageable);
    long countByCourse_Id(Long courseId);

    @Query("SELECT a FROM Absence a WHERE a.date = :date ORDER BY a.student.id, a.course.id")
    List<Absence> findByDate(@Param("date") LocalDate date);

    @Query("SELECT a FROM Absence a WHERE a.student.id = :studentId AND a.course.id = :courseId ORDER BY a.date")
    List<Absence> findByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT a FROM Absence a WHERE a.date BETWEEN :startDate AND :endDate ORDER BY a.student.id, a.course.id, a.date")
    List<Absence> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(a) FROM Absence a WHERE a.student.id = :studentId AND a.course.id = :courseId")
    Long countByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT a FROM Absence a WHERE " +
           "(:studentId IS NULL OR a.student.id = :studentId) AND " +
           "(:courseId IS NULL OR a.course.id = :courseId) AND " +
           "(:dateFrom IS NULL OR a.date >= :dateFrom) AND " +
           "(:dateTo IS NULL OR a.date <= :dateTo) " +
           "ORDER BY a.student.id, a.course.id, a.date")
    Page<Absence> findFilteredAbsences(@Param("studentId") Long studentId, 
                                       @Param("courseId") Long courseId,
                                       @Param("dateFrom") LocalDate dateFrom, 
                                       @Param("dateTo") LocalDate dateTo, 
                                       Pageable pageable);
}