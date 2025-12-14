package com.studentregistry.service;

import com.studentregistry.entity.User;
import com.studentregistry.repository.UserRepository;
 
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, LogService logService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll(Sort.by("id"));
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user, String username) {
        // Encode password before saving
        if (user.getPasswordHash() != null) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }
        User saved = userRepository.save(user);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "userId", saved.getId(),
                "username", saved.getUsername() != null ? saved.getUsername() : "",
                "email", saved.getEmail() != null ? saved.getEmail() : "",
                "role", saved.getRole() != null ? saved.getRole().getName() : ""
            ));
            logService.logActionByUsername(username, "CREATE_USER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return saved;
    }

    public User updateUser(Long id, User userDetails, String username) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        String oldUsername = user.getUsername();
        String oldEmail = user.getEmail();
        
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setStatus(userDetails.getStatus());
        
        // Only encode password if it's being updated
        if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        }
        
        User updated = userRepository.save(user);
        try {
            String details = objectMapper.writeValueAsString(Map.of(
                "userId", updated.getId(),
                "oldUsername", oldUsername != null ? oldUsername : "",
                "newUsername", updated.getUsername() != null ? updated.getUsername() : "",
                "oldEmail", oldEmail != null ? oldEmail : "",
                "newEmail", updated.getEmail() != null ? updated.getEmail() : ""
            ));
            logService.logActionByUsername(username, "UPDATE_USER", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return updated;
    }

    public void deleteUser(Long id, String username) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            try {
                String details = objectMapper.writeValueAsString(Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername() != null ? user.getUsername() : "",
                    "email", user.getEmail() != null ? user.getEmail() : ""
                ));
                logService.logActionByUsername(username, "DELETE_USER", details);
            } catch (Exception e) {
                // Logging failure shouldn't break the operation
            }
        }
        userRepository.deleteById(id);
    }

    public List<User> getUsersByStatus(User.Status status) {
        return userRepository.findByStatus(status, Sort.by("id"));
    }

    public List<User> getUsersByRole(String roleName) {
        return userRepository.findByRole_Name(roleName, Sort.by("id"));
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public Page<User> getFilteredUsers(String email, String role, Pageable pageable) {
        return userRepository.findFilteredUsers(email, role, pageable);
    }
}