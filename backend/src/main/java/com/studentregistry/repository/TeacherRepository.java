package com.studentregistry.repository;

import com.studentregistry.entity.Teacher;
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
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    List<Teacher> findByDepartment(String department, Sort sort);

    Optional<Teacher> findByEmail(String email);

    Optional<Teacher> findByUser_Id(Long userId);

    @Query("SELECT t FROM Teacher t WHERE t.firstName LIKE %:name% OR t.lastName LIKE %:name% ORDER BY t.id")
    List<Teacher> findByNameContaining(@Param("name") String name);

    boolean existsByEmail(String email);
    
    boolean existsByUser_Id(Long userId);

    @Query("SELECT t FROM Teacher t WHERE " +
           "(:name IS NULL OR t.firstName LIKE %:name% OR t.lastName LIKE %:name%) AND " +
           "(:department IS NULL OR t.department = :department) " +
           "ORDER BY t.id")
    Page<Teacher> findFilteredTeachers(@Param("name") String name,
                                     @Param("department") String department,
                                     Pageable pageable);
}