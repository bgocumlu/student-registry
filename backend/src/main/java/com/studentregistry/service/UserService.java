package com.studentregistry.service;

import com.studentregistry.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();

    Optional<User> getUserById(Long id);

    Optional<User> getUserByUsername(String username);

    Optional<User> getUserByEmail(String email);

    User saveUser(User user, String username);

    User updateUser(Long id, User userDetails, String username);

    void deleteUser(Long id, String username);

    List<User> getUsersByStatus(User.Status status);

    List<User> getUsersByRole(String roleName);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> getFilteredUsers(String email, String role, Pageable pageable);
}
