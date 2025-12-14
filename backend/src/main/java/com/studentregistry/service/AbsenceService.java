package com.studentregistry.service;

import com.studentregistry.entity.Absence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AbsenceService {
    List<Absence> getAllAbsences();

    Optional<Absence> getAbsenceById(Absence.AbsenceId id);

    Absence saveAbsence(Absence absence);

    void deleteAbsence(Absence.AbsenceId id);

    List<Absence> getAbsencesByStudent(Long studentId);

    Page<Absence> getAbsencesByStudent(Long studentId, Pageable pageable);

    List<Absence> getAbsencesByCourse(Long courseId);

    Page<Absence> getAbsencesByCourse(Long courseId, Pageable pageable);

    Page<Absence> getFilteredAbsences(Long studentId, Long courseId, LocalDate dateFrom, LocalDate dateTo,
            Pageable pageable);

    List<Absence> getAbsencesByDate(LocalDate date);

    List<Absence> getAbsencesByStudentAndCourse(Long studentId, Long courseId);

    List<Absence> getAbsencesByDateRange(LocalDate startDate, LocalDate endDate);

    Long countAbsencesByStudentAndCourse(Long studentId, Long courseId);

    Page<Absence> getAbsencesByStudentId(Long studentId, Pageable pageable);

    Page<Absence> getAbsencesByCourseId(Long courseId, Pageable pageable);

    void addAbsence(Long studentId, Long courseId, String dateString, String username);

    void removeAbsence(Long studentId, Long courseId, String dateString, String username);
}
