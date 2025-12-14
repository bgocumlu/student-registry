package com.studentregistry.service;

import com.studentregistry.entity.Course;
import com.studentregistry.repository.CourseRepository;
import com.studentregistry.repository.EnrollmentRepository;
import com.studentregistry.repository.AbsenceRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AbsenceRepository absenceRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public CourseService(CourseRepository courseRepository, 
                        EnrollmentRepository enrollmentRepository,
                        AbsenceRepository absenceRepository,
                        LogService logService) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.absenceRepository = absenceRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll(Sort.by("id"));
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public Course saveCourse(Course course, String username) {
        Course saved = courseRepository.save(course);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "courseId", saved.getId(),
                "courseCode", saved.getCourseCode() != null ? saved.getCourseCode() : "",
                "courseName", saved.getCourseName() != null ? saved.getCourseName() : "",
                "section", saved.getSection() != null ? saved.getSection() : "",
                "semester", saved.getSemester() != null ? saved.getSemester() : ""
            ));
            logService.logActionByUsername(username, "CREATE_COURSE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return saved;
    }

    public Course updateCourse(Long id, Course courseDetails, String username) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        
        String oldCode = course.getCourseCode();
        String oldName = course.getCourseName();
        
        course.setCourseCode(courseDetails.getCourseCode());
        course.setSection(courseDetails.getSection());
        course.setCourseName(courseDetails.getCourseName());
        course.setDescription(courseDetails.getDescription());
        course.setCredit(courseDetails.getCredit());
        course.setDepartment(courseDetails.getDepartment());
        course.setSemester(courseDetails.getSemester());
        course.setTeacher(courseDetails.getTeacher());
        course.setStatus(courseDetails.getStatus());
        
        Course updated = courseRepository.save(course);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "courseId", updated.getId(),
                "oldCode", oldCode != null ? oldCode : "",
                "newCode", updated.getCourseCode() != null ? updated.getCourseCode() : "",
                "oldName", oldName != null ? oldName : "",
                "newName", updated.getCourseName() != null ? updated.getCourseName() : ""
            ));
            logService.logActionByUsername(username, "UPDATE_COURSE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return updated;
    }

    public void deleteCourse(Long id, String username) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (!courseOpt.isPresent()) {
            throw new RuntimeException("Course not found with id: " + id);
        }
        
        Course course = courseOpt.get();
        
        // Check if course has enrollments
        long enrollmentCount = enrollmentRepository.countByCourse_Id(id);
        if (enrollmentCount > 0) {
            throw new RuntimeException("Cannot delete course: It has " + enrollmentCount + " associated enrollment(s). Please remove them first.");
        }
        
        // Check if course has absences
        long absenceCount = absenceRepository.countByCourse_Id(id);
        if (absenceCount > 0) {
            throw new RuntimeException("Cannot delete course: It has " + absenceCount + " associated absence record(s). Please remove them first.");
        }
        
        // Log the deletion before actually deleting
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "courseId", course.getId(),
                "courseCode", course.getCourseCode() != null ? course.getCourseCode() : "",
                "courseName", course.getCourseName() != null ? course.getCourseName() : ""
            ));
            logService.logActionByUsername(username, "DELETE_COURSE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        
        courseRepository.deleteById(id);
    }

    public List<Course> getCoursesBySemester(String semester) {
        return courseRepository.findBySemester(semester, Sort.by("id"));
    }

    public List<Course> getCoursesByDepartment(String department) {
        return courseRepository.findByDepartment(department, Sort.by("id"));
    }

    public List<Course> getCoursesByStatus(Course.Status status) {
        return courseRepository.findByStatus(status, Sort.by("id"));
    }

    public List<Course> getCoursesByTeacher(Long teacherId) {
        return courseRepository.findByTeacher_Id(teacherId, Sort.by("id"));
    }

    public Optional<Course> getCourseByCodeSemesterSection(String courseCode, String semester, String section) {
        return courseRepository.findByCourseCodeAndSemesterAndSection(courseCode, semester, section);
    }

    public List<Course> searchCourses(String searchTerm) {
        return courseRepository.findByCourseNameOrCodeContaining(searchTerm, searchTerm);
    }

    public Page<Course> getFilteredCourses(String name, String department, String semester, 
                                         Long teacherId, Pageable pageable) {
        return courseRepository.findFilteredCourses(name, department, semester, teacherId, pageable);
    }
}