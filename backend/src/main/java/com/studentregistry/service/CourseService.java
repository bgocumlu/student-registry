package com.studentregistry.service;

import com.studentregistry.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface CourseService {
    List<Course> getAllCourses();

    Optional<Course> getCourseById(Long id);

    Course saveCourse(Course course, String username);

    Course updateCourse(Long id, Course courseDetails, String username);

    void deleteCourse(Long id, String username);

    List<Course> getCoursesBySemester(String semester);

    List<Course> getCoursesByDepartment(String department);

    List<Course> getCoursesByStatus(Course.Status status);

    List<Course> getCoursesByTeacher(Long teacherId);

    Optional<Course> getCourseByCodeSemesterSection(String courseCode, String semester, String section);

    List<Course> searchCourses(String searchTerm);

    Page<Course> getFilteredCourses(String name, String department, String semester,
            Long teacherId, Pageable pageable);
}
