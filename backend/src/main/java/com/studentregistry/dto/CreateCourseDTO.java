package com.studentregistry.dto;

import com.studentregistry.entity.Course;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateCourseDTO {
    
    @NotBlank(message = "Course code is required")
    private String courseCode;
    
    @NotBlank(message = "Section is required")
    private String section;
    
    @NotBlank(message = "Course name is required")
    private String courseName;
    
    private String description;
    
    private Integer credit;
    
    private String department;
    
    @NotBlank(message = "Semester is required")
    private String semester;
    
    private Long teacherId;
    
    @NotNull(message = "Status is required")
    private Course.Status status;

    // Constructors
    public CreateCourseDTO() {}

    // Getters and setters
    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCredit() {
        return credit;
    }

    public void setCredit(Integer credit) {
        this.credit = credit;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public Course.Status getStatus() {
        return status;
    }

    public void setStatus(Course.Status status) {
        this.status = status;
    }
}