package com.studentregistry.repository;

import com.studentregistry.entity.Student;
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
public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByStatus(Student.Status status, Sort sort);

    List<Student> findByDepartment(String department, Sort sort);

    List<Student> findByEnrollmentYear(int enrollmentYear, Sort sort);

    Optional<Student> findByEmail(String email);

    @Query("SELECT s FROM Student s WHERE s.firstName LIKE %:name% OR s.lastName LIKE %:name% ORDER BY s.id")
    List<Student> findByNameContaining(@Param("name") String name, Sort sort);

    List<Student> findByDepartmentAndEnrollmentYear(String department, int enrollmentYear);

    @Query("SELECT s FROM Student s WHERE " +
           "(:name IS NULL OR s.firstName LIKE %:name% OR s.lastName LIKE %:name%) AND " +
           "(:department IS NULL OR s.department = :department) AND " +
           "(:enrollmentYear IS NULL OR s.enrollmentYear = :enrollmentYear) AND " +
           "(:status IS NULL OR s.status = :status) " +
           "ORDER BY s.id")
    Page<Student> findFilteredStudents(@Param("name") String name,
                                     @Param("department") String department,
                                     @Param("enrollmentYear") Integer enrollmentYear,
                                     @Param("status") Student.Status status,
                                     Pageable pageable);
}