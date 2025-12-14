package com.studentregistry.dto;

import com.studentregistry.entity.*;
import com.studentregistry.repository.*;
import org.springframework.stereotype.Component;

@Component
public class DTOMapper {

    private final RoleRepository roleRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public DTOMapper(RoleRepository roleRepository, StudentRepository studentRepository, 
                     CourseRepository courseRepository, TeacherRepository teacherRepository, 
                     UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }

    // Student mappings
    public Student toEntity(CreateStudentDTO dto) {
        Student student = new Student();
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGender(dto.getGender());
        student.setPhone(dto.getPhone());
        student.setEmail(dto.getEmail());
        student.setAddress(dto.getAddress());
        student.setDepartment(dto.getDepartment());
        student.setProgram(dto.getProgram());
        student.setEnrollmentYear(dto.getEnrollmentYear());
        student.setStatus(dto.getStatus());
        return student;
    }

    // User mappings
    public User toEntity(CreateUserDTO dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPassword()); // Will be encoded in service
        user.setStatus(dto.getStatus());
        
        // Set role
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + dto.getRoleId()));
        user.setRole(role);
        
        return user;
    }

    // Course mappings
    public Course toEntity(CreateCourseDTO dto) {
        Course course = new Course();
        course.setCourseCode(dto.getCourseCode());
        course.setSection(dto.getSection());
        course.setCourseName(dto.getCourseName());
        course.setDescription(dto.getDescription());
        course.setCredit(dto.getCredit());
        course.setDepartment(dto.getDepartment());
        course.setSemester(dto.getSemester());
        course.setStatus(dto.getStatus());
        
        // Set teacher if provided
        if (dto.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + dto.getTeacherId()));
            course.setTeacher(teacher);
        }
        
        return course;
    }

    // Teacher mappings
    public Teacher toEntity(CreateTeacherDTO dto) {
        Teacher teacher = new Teacher();
        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setDepartment(dto.getDepartment());
        teacher.setEmail(dto.getEmail());
        teacher.setPhone(dto.getPhone());
        
        // Set user if provided
        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));
            teacher.setUser(user);
        }
        
        return teacher;
    }

    // Enrollment mappings
    public Enrollment toEntity(CreateEnrollmentDTO dto) {
        Enrollment enrollment = new Enrollment();
        enrollment.setFinalGrade(dto.getFinalGrade());
        
        // Set student
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + dto.getStudentId()));
        enrollment.setStudent(student);
        
        // Set course
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + dto.getCourseId()));
        enrollment.setCourse(course);
        
        return enrollment;
    }

    // Role mappings
    public Role toEntity(CreateRoleDTO dto) {
        Role role = new Role();
        role.setName(dto.getName());
        return role;
    }
}