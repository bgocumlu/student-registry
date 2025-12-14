package com.studentregistry.service;

import com.studentregistry.entity.Absence;
import com.studentregistry.repository.AbsenceRepository;
import com.studentregistry.repository.StudentRepository;
import com.studentregistry.repository.CourseRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AbsenceService {

    private final AbsenceRepository absenceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public AbsenceService(AbsenceRepository absenceRepository, 
                         StudentRepository studentRepository,
                         CourseRepository courseRepository,
                         LogService logService) {
        this.absenceRepository = absenceRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Absence> getAllAbsences() {
        return absenceRepository.findAll(Sort.by("student.id", "course.id", "date"));
    }

    public Optional<Absence> getAbsenceById(Absence.AbsenceId id) {
        return absenceRepository.findById(id);
    }

    public Absence saveAbsence(Absence absence) {
        return absenceRepository.save(absence);
    }

    public void deleteAbsence(Absence.AbsenceId id) {
        absenceRepository.deleteById(id);
    }

    public List<Absence> getAbsencesByStudent(Long studentId) {
        return absenceRepository.findByStudent_Id(studentId, Sort.by("course.id", "date"));
    }

    public Page<Absence> getAbsencesByStudent(Long studentId, Pageable pageable) {
        return absenceRepository.findByStudent_Id(studentId, pageable);
    }

    public List<Absence> getAbsencesByCourse(Long courseId) {
        return absenceRepository.findByCourse_Id(courseId, Sort.by("student.id", "date"));
    }

    public Page<Absence> getAbsencesByCourse(Long courseId, Pageable pageable) {
        return absenceRepository.findByCourse_Id(courseId, pageable);
    }

    public Page<Absence> getFilteredAbsences(Long studentId, Long courseId, LocalDate dateFrom, LocalDate dateTo, Pageable pageable) {
        return absenceRepository.findFilteredAbsences(studentId, courseId, dateFrom, dateTo, pageable);
    }

    public List<Absence> getAbsencesByDate(LocalDate date) {
        return absenceRepository.findByDate(date);
    }

    public List<Absence> getAbsencesByStudentAndCourse(Long studentId, Long courseId) {
        return absenceRepository.findByStudentAndCourse(studentId, courseId);
    }

    public List<Absence> getAbsencesByDateRange(LocalDate startDate, LocalDate endDate) {
        return absenceRepository.findByDateRange(startDate, endDate);
    }

    public Long countAbsencesByStudentAndCourse(Long studentId, Long courseId) {
        return absenceRepository.countByStudentAndCourse(studentId, courseId);
    }

    public Page<Absence> getAbsencesByStudentId(Long studentId, Pageable pageable) {
        return absenceRepository.findByStudent_Id(studentId, pageable);
    }

    public Page<Absence> getAbsencesByCourseId(Long courseId, Pageable pageable) {
        return absenceRepository.findByCourse_Id(courseId, pageable);
    }

    public void addAbsence(Long studentId, Long courseId, String dateString, String username) {
        LocalDate date = LocalDate.parse(dateString);
        Absence.AbsenceId absenceId = new Absence.AbsenceId(studentId, courseId, date);
        
        // Check if absence already exists
        if (absenceRepository.existsById(absenceId)) {
            throw new RuntimeException("Absence record already exists for this date");
        }
        
        Absence absence = new Absence();
        absence.setStudent(studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found")));
        absence.setCourse(courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found")));
        absence.setDate(date);
        absenceRepository.save(absence);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", studentId,
                "courseId", courseId,
                "courseCode", absence.getCourse().getCourseCode() != null ? absence.getCourse().getCourseCode() : "",
                "date", dateString
            ));
            logService.logActionByUsername(username, "ADD_ABSENCE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
    }

    public void removeAbsence(Long studentId, Long courseId, String dateString, String username) {
        LocalDate date = LocalDate.parse(dateString);
        Absence.AbsenceId absenceId = new Absence.AbsenceId(studentId, courseId, date);
        
        Optional<Absence> absenceOpt = absenceRepository.findById(absenceId);
        if (!absenceOpt.isPresent()) {
            throw new RuntimeException("Absence record not found");
        }
        
        Absence absence = absenceOpt.get();
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", studentId,
                "courseId", courseId,
                "courseCode", absence.getCourse().getCourseCode() != null ? absence.getCourse().getCourseCode() : "",
                "date", dateString
            ));
            logService.logActionByUsername(username, "REMOVE_ABSENCE", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        
        absenceRepository.deleteById(absenceId);
    }
}