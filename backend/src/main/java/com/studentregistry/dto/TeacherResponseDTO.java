package com.studentregistry.dto;

import com.studentregistry.entity.Teacher;
import java.time.LocalDateTime;

public class TeacherResponseDTO {
    
    private Long id;
    private String firstName;
    private String lastName;
    private String department;
    private String email;
    private String phone;
    private Long userId; // Only expose userId, not the full user object
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public TeacherResponseDTO() {}

    public TeacherResponseDTO(Teacher teacher) {
        this.id = teacher.getId();
        this.firstName = teacher.getFirstName();
        this.lastName = teacher.getLastName();
        this.department = teacher.getDepartment();
        this.email = teacher.getEmail();
        this.phone = teacher.getPhone();
        this.userId = teacher.getUser() != null ? teacher.getUser().getId() : null;
        this.createdAt = teacher.getCreatedAt();
        this.updatedAt = teacher.getUpdatedAt();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

