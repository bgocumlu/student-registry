package com.studentregistry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

// CREATE TABLE enrollments (
//     id SERIAL PRIMARY KEY,
//     student_id INTEGER NOT NULL,
//     course_id INTEGER NOT NULL,
//     final_grade VARCHAR(10),
//     enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

//     CONSTRAINT uq_enrollment
//         UNIQUE (student_id, course_id),

//     CONSTRAINT fk_enrollments_student
//         FOREIGN KEY (student_id)
//         REFERENCES students(id)
//         ON DELETE RESTRICT,

//     CONSTRAINT fk_enrollments_course
//         FOREIGN KEY (course_id)
//         REFERENCES courses(id)
//         ON DELETE RESTRICT
// );

@Entity
@Table(name = "enrollments", uniqueConstraints = {
        @UniqueConstraint(name = "uq_enrollment", columnNames = { "student_id", "course_id" })
})
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false)
    private long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "final_grade", length = 10)
    private String finalGrade;

    @CreationTimestamp
    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Enrollment() {
    }

    public Enrollment(Student student, Course course, String finalGrade) {
        this.student = student;
        this.course = course;
        this.finalGrade = finalGrade;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getFinalGrade() {
        return finalGrade;
    }

    public void setFinalGrade(String finalGrade) {
        this.finalGrade = finalGrade;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}