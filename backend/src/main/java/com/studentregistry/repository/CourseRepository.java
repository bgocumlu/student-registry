package com.studentregistry.repository;

import com.studentregistry.entity.Course;
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
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findBySemester(String semester, Sort sort);

    List<Course> findByDepartment(String department, Sort sort);

    List<Course> findByStatus(Course.Status status, Sort sort);

    List<Course> findByTeacher_Id(Long teacherId, Sort sort);

    Optional<Course> findByCourseCodeAndSemesterAndSection(String courseCode, String semester, String section);

    @Query("SELECT c FROM Course c WHERE c.courseName LIKE %:name% OR c.courseCode LIKE %:code% ORDER BY c.id")
    List<Course> findByCourseNameOrCodeContaining(@Param("name") String name, @Param("code") String code);

    List<Course> findBySemesterAndDepartment(String semester, String department);

    @Query("SELECT c FROM Course c WHERE " +
           "(:name IS NULL OR c.courseName LIKE %:name%) AND " +
           "(:department IS NULL OR c.department = :department) AND " +
           "(:semester IS NULL OR c.semester = :semester) AND " +
           "(:teacherId IS NULL OR c.teacher.id = :teacherId) " +
           "ORDER BY c.id")
    Page<Course> findFilteredCourses(@Param("name") String name,
                                   @Param("department") String department,
                                   @Param("semester") String semester,
                                   @Param("teacherId") Long teacherId,
                                   Pageable pageable);
}