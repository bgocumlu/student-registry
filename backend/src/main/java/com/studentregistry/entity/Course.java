package com.studentregistry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

// CREATE TABLE courses (
//     id SERIAL PRIMARY KEY,
//     course_code VARCHAR(50) NOT NULL,
//     section VARCHAR(10) NOT NULL,
//     course_name VARCHAR(200) NOT NULL,
//     description TEXT,
//     credit INTEGER,
//     department VARCHAR(150),
//     semester VARCHAR(50) NOT NULL,
//     teacher_id INTEGER,
//     status VARCHAR(20) NOT NULL,
//     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

//     CONSTRAINT uq_course_offering
//         UNIQUE (course_code, semester, section),

//     CONSTRAINT fk_courses_teacher
//         FOREIGN KEY (teacher_id)
//         REFERENCES teachers(id)
//         ON DELETE RESTRICT
// );

@Entity
@Table(name = "courses", uniqueConstraints = {
        @UniqueConstraint(name = "uq_course_offering", columnNames = { "course_code", "semester", "section" })
})
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private long id;

    @Column(name = "course_code", length = 50, nullable = false)
    private String courseCode;

    @Column(name = "section", length = 10, nullable = false)
    private String section;

    @Column(name = "course_name", length = 200, nullable = false)
    private String courseName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "credit")
    private Integer credit;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "semester", length = 50, nullable = false)
    private String semester;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Course() {
    }

    public Course(String courseCode, String section, String courseName, String description,
            Integer credit, String department, String semester, Teacher teacher, Status status) {
        this.courseCode = courseCode;
        this.section = section;
        this.courseName = courseName;
        this.description = description;
        this.credit = credit;
        this.department = department;
        this.semester = semester;
        this.teacher = teacher;
        this.status = status;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

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

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
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

    public enum Status {
        ACTIVE("active"),
        INACTIVE("inactive"),
        CANCELLED("cancelled");

        private final String value;

        Status(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }
}