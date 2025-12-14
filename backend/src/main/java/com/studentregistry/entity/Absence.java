package com.studentregistry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

// CREATE TABLE absences (
//     student_id INTEGER NOT NULL,
//     course_id INTEGER NOT NULL,
//     date DATE NOT NULL,

//     CONSTRAINT pk_absences
//         PRIMARY KEY (student_id, course_id, date),

//     CONSTRAINT fk_absences_student
//         FOREIGN KEY (student_id)
//         REFERENCES students(id)
//         ON DELETE RESTRICT,

//     CONSTRAINT fk_absences_course
//         FOREIGN KEY (course_id)
//         REFERENCES courses(id)
//         ON DELETE RESTRICT
// );

@Entity
@Table(name = "absences")
@IdClass(Absence.AbsenceId.class)
public class Absence {

    @Id
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Id
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Id
    @Column(name = "date", nullable = false)
    private LocalDate date;

    public Absence() {
    }

    public Absence(Student student, Course course, LocalDate date) {
        this.student = student;
        this.course = course;
        this.date = date;
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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public static class AbsenceId implements Serializable {
        private Long student;
        private Long course;
        private LocalDate date;

        public AbsenceId() {
        }

        public AbsenceId(Long student, Long course, LocalDate date) {
            this.student = student;
            this.course = course;
            this.date = date;
        }

        public Long getStudent() {
            return student;
        }

        public void setStudent(Long student) {
            this.student = student;
        }

        public Long getCourse() {
            return course;
        }

        public void setCourse(Long course) {
            this.course = course;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (o == null || getClass() != o.getClass())
                return false;
            AbsenceId absenceId = (AbsenceId) o;
            return Objects.equals(student, absenceId.student) &&
                    Objects.equals(course, absenceId.course) &&
                    Objects.equals(date, absenceId.date);
        }

        @Override
        public int hashCode() {
            return Objects.hash(student, course, date);
        }
    }
}