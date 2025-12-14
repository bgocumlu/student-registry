package com.studentregistry.service;

import com.studentregistry.entity.Student;
import com.studentregistry.repository.StudentRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public StudentService(StudentRepository studentRepository, LogService logService) {
        this.studentRepository = studentRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll(Sort.by("id"));
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    public Student saveStudent(Student student, String username) {
        Student saved = studentRepository.save(student);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", saved.getId(),
                "name", saved.getFirstName() + " " + saved.getLastName(),
                "department", saved.getDepartment() != null ? saved.getDepartment() : "",
                "status", saved.getStatus() != null ? saved.getStatus().getValue() : ""
            ));
            logService.logActionByUsername(username, "CREATE_STUDENT", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return saved;
    }

    public Student updateStudent(Long id, Student studentDetails, String username) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
        
        String oldName = student.getFirstName() + " " + student.getLastName();
        String oldStatus = student.getStatus() != null ? student.getStatus().getValue() : "";
        
        student.setFirstName(studentDetails.getFirstName());
        student.setLastName(studentDetails.getLastName());
        student.setDateOfBirth(studentDetails.getDateOfBirth());
        student.setGender(studentDetails.getGender());
        student.setPhone(studentDetails.getPhone());
        student.setEmail(studentDetails.getEmail());
        student.setAddress(studentDetails.getAddress());
        student.setDepartment(studentDetails.getDepartment());
        student.setProgram(studentDetails.getProgram());
        student.setEnrollmentYear(studentDetails.getEnrollmentYear());
        student.setStatus(studentDetails.getStatus());
        
        Student updated = studentRepository.save(student);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "studentId", updated.getId(),
                "oldName", oldName,
                "newName", updated.getFirstName() + " " + updated.getLastName(),
                "oldStatus", oldStatus,
                "newStatus", updated.getStatus() != null ? updated.getStatus().getValue() : ""
            ));
            logService.logActionByUsername(username, "UPDATE_STUDENT", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return updated;
    }

    public void deleteStudent(Long id, String username) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            try {
                String details = objectMapper.writeValueAsString(Map.of(
                    "studentId", student.getId(),
                    "name", student.getFirstName() + " " + student.getLastName()
                ));
                logService.logActionByUsername(username, "DELETE_STUDENT", details);
            } catch (Exception e) {
                // Logging failure shouldn't break the operation
            }
        }
        studentRepository.deleteById(id);
    }

    public List<Student> getStudentsByStatus(Student.Status status) {
        return studentRepository.findByStatus(status, Sort.by("id"));
    }

    public List<Student> getStudentsByDepartment(String department) {
        return studentRepository.findByDepartment(department, Sort.by("id"));
    }

    public List<Student> getStudentsByEnrollmentYear(int year) {
        return studentRepository.findByEnrollmentYear(year, Sort.by("id"));
    }

    public Optional<Student> getStudentByEmail(String email) {
        return studentRepository.findByEmail(email);
    }

    public List<Student> searchStudentsByName(String name) {
        return studentRepository.findByNameContaining(name, Sort.by("id"));
    }

    public Page<Student> getFilteredStudents(String name, String department, Integer enrollmentYear, 
                                           Student.Status status, Pageable pageable) {
        return studentRepository.findFilteredStudents(name, department, enrollmentYear, status, pageable);
    }
}