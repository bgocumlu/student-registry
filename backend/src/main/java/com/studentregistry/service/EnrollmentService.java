package com.studentregistry.service;

import com.studentregistry.entity.Enrollment;
import com.studentregistry.repository.EnrollmentRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public EnrollmentService(EnrollmentRepository enrollmentRepository, LogService logService) {
        this.enrollmentRepository = enrollmentRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll(Sort.by("id"));
    }

    public Optional<Enrollment> getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id);
    }

    public Enrollment saveEnrollment(Enrollment enrollment, String username) {
        // Check if enrollment already exists
        Optional<Enrollment> existing = enrollmentRepository
                .findByStudent_IdAndCourse_Id(enrollment.getStudent().getId(), enrollment.getCourse().getId());
        if (existing.isPresent()) {
            throw new RuntimeException("Student is already enrolled in this course");
        }
        Enrollment saved = enrollmentRepository.save(enrollment);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "enrollmentId", saved.getId(),
                "studentId", saved.getStudent().getId(),
                "courseId", saved.getCourse().getId(),
                "courseCode", saved.getCourse().getCourseCode() != null ? saved.getCourse().getCourseCode() : ""
            ));
            logService.logActionByUsername(username, "CREATE_ENROLLMENT", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return saved;
    }

    public Enrollment updateEnrollment(Long id, Enrollment enrollmentDetails) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + id));
        
        enrollment.setStudent(enrollmentDetails.getStudent());
        enrollment.setCourse(enrollmentDetails.getCourse());
        enrollment.setFinalGrade(enrollmentDetails.getFinalGrade());
        
        return enrollmentRepository.save(enrollment);
    }

    public void deleteEnrollment(Long id) {
        enrollmentRepository.deleteById(id);
    }

    public List<Enrollment> getEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudent_Id(studentId, Sort.by("id"));
    }

    public List<Enrollment> getEnrollmentsByCourse(Long courseId) {
        return enrollmentRepository.findByCourse_Id(courseId, Sort.by("id"));
    }

    public Optional<Enrollment> getEnrollmentByStudentAndCourse(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId);
    }

    public List<Enrollment> getEnrollmentsBySemester(String semester) {
        return enrollmentRepository.findBySemester(semester);
    }

    public List<Enrollment> getEnrollmentsByStudentAndSemester(Long studentId, String semester) {
        return enrollmentRepository.findByStudentAndSemester(studentId, semester);
    }

    public List<Enrollment> getGradedEnrollments() {
        return enrollmentRepository.findByFinalGradeIsNotNull();
    }

    public List<Enrollment> getUngradedEnrollments() {
        return enrollmentRepository.findByFinalGradeIsNull();
    }

    public Page<Enrollment> getEnrollmentsByStudentId(Long studentId, Pageable pageable) {
        return enrollmentRepository.findByStudent_Id(studentId, pageable);
    }

    public Page<Enrollment> getEnrollmentsByCourseId(Long courseId, Pageable pageable) {
        return enrollmentRepository.findByCourse_Id(courseId, pageable);
    }

    public void removeEnrollment(Long studentId, Long courseId, String username) {
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", studentId,
                "courseId", courseId,
                "courseCode", enrollment.getCourse().getCourseCode() != null ? enrollment.getCourse().getCourseCode() : ""
            ));
            logService.logActionByUsername(username, "REMOVE_ENROLLMENT", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        enrollmentRepository.delete(enrollment);
    }

    public void updateGrade(Long studentId, Long courseId, String finalGrade, String username) {
        Enrollment enrollment = enrollmentRepository.findByStudent_IdAndCourse_Id(studentId, courseId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        String oldGrade = enrollment.getFinalGrade();
        enrollment.setFinalGrade(finalGrade);
        enrollmentRepository.save(enrollment);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", studentId,
                "courseId", courseId,
                "courseCode", enrollment.getCourse().getCourseCode() != null ? enrollment.getCourse().getCourseCode() : "",
                "oldGrade", oldGrade != null ? oldGrade : "null",
                "newGrade", finalGrade != null ? finalGrade : "null"
            ));
            logService.logActionByUsername(username, "UPDATE_GRADE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
    }
}