package com.studentregistry.service;

import com.studentregistry.entity.Log;
import com.studentregistry.entity.User;
import com.studentregistry.repository.LogRepository;
import com.studentregistry.repository.UserRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LogService {

    private final LogRepository logRepository;
    private final UserRepository userRepository;

    public LogService(LogRepository logRepository, UserRepository userRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    public List<Log> getAllLogs() {
        return logRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public Optional<Log> getLogById(Long id) {
        return logRepository.findById(id);
    }

    public Log saveLog(Log log) {
        return logRepository.save(log);
    }

    public void deleteLog(Long id) {
        logRepository.deleteById(id);
    }

    public List<Log> getLogsByUser(Long userId) {
        return logRepository.findByUser_Id(userId, Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<Log> getLogsByAction(String action) {
        return logRepository.findByAction(action, Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<Log> getLogsByTimestampRange(LocalDateTime startDate, LocalDateTime endDate) {
        return logRepository.findByTimestampRange(startDate, endDate);
    }

    public List<Log> getLogsByUserAndTimestampRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return logRepository.findByUserAndTimestampRange(userId, startDate, endDate);
    }

    // Utility method to create and save logs with userId
    public void logAction(Long userId, String action, String details) {
        try {
            Log log = new Log();
            if (userId != null) {
                Optional<User> user = userRepository.findById(userId);
                log.setUser(user.orElse(null));
            } else {
                log.setUser(null);
            }
            log.setAction(action);
            log.setDetails(details);
            saveLog(log);
        } catch (Exception e) {
            // Don't let logging failures break the main operation
            // Log to console for debugging
            System.err.println("Failed to log action: " + action + " - " + e.getMessage());
        }
    }

    // Utility method to create and save logs with username (looks up user ID)
    public void logActionByUsername(String username, String action, String details) {
        try {
            Long userId = null;
            if (username != null && !username.isEmpty()) {
                Optional<User> user = userRepository.findByUsername(username);
                if (user.isPresent()) {
                    userId = user.get().getId();
                }
            }
            logAction(userId, action, details);
        } catch (Exception e) {
            // Don't let logging failures break the main operation
            System.err.println("Failed to log action by username: " + action + " - " + e.getMessage());
        }
    }

    public Page<Log> getFilteredLogs(String action, Long userId, Long courseId, Long studentId, 
                                   LocalDateTime dateFrom, LocalDateTime dateTo, Pageable pageable) {
        // Note: courseId and studentId are not stored directly in Log entity, 
        // but passed through for API compatibility - they are ignored in the query
        
        // Use Specification to build dynamic query and avoid PostgreSQL type inference issues
        Specification<Log> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (action != null && !action.isEmpty()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), dateFrom));
            }
            
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), dateTo));
            }
            
            query.orderBy(cb.desc(root.get("id")));
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return logRepository.findAll(spec, pageable);
    }
}