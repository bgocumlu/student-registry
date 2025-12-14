package com.studentregistry.controller;

import com.studentregistry.dto.CreateUserDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.dto.UserResponseDTO;
import com.studentregistry.entity.User;
import com.studentregistry.service.UserService;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import com.studentregistry.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;
    private final DTOMapper dtoMapper;

    public UserController(UserService userService, DTOMapper dtoMapper) {
        this.userService = userService;
        this.dtoMapper = dtoMapper;
    }

    @GetMapping
    @Operation(summary = "Get all users with filtering and pagination")
    public PaginatedResponse<UserResponseDTO> getAllUsers(
            @Parameter(description = "Filter by email (partial match)") @RequestParam(required = false) String email,
            @Parameter(description = "Filter by role name") @RequestParam(required = false) String role,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("id"));
        Page<User> users = userService.getFilteredUsers(email, role, pageable);
        Page<UserResponseDTO> userDtos = users.map(UserResponseDTO::new);
        return PaginatedResponse.fromPage(userDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(new UserResponseDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserDTO createUserDTO, Authentication authentication) {
        // Check if user with email already exists
        if (userService.existsByEmail(createUserDTO.getEmail())) {
            throw new RuntimeException("User with email " + createUserDTO.getEmail() + " already exists");
        }
        
        // Check if user with username already exists
        if (userService.existsByUsername(createUserDTO.getUsername())) {
            throw new RuntimeException("User with username " + createUserDTO.getUsername() + " already exists");
        }
        
        User user = dtoMapper.toEntity(createUserDTO);
        String username = authentication != null ? authentication.getName() : null;
        User savedUser = userService.saveUser(user, username);
        return new UserResponseDTO(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id, @Valid @RequestBody CreateUserDTO updateUserDTO, Authentication authentication) {
        try {
            User userDetails = dtoMapper.toEntity(updateUserDTO);
            String username = authentication != null ? authentication.getName() : null;
            User updatedUser = userService.updateUser(id, userDetails, username);
            return ResponseEntity.ok(new UserResponseDTO(updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            userService.deleteUser(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponseDTO> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> ResponseEntity.ok(new UserResponseDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(user -> ResponseEntity.ok(new UserResponseDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<UserResponseDTO> getUsersByStatus(@PathVariable User.Status status) {
        return userService.getUsersByStatus(status).stream()
                .map(UserResponseDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/role/{roleName}")
    public List<UserResponseDTO> getUsersByRole(@PathVariable String roleName) {
        return userService.getUsersByRole(roleName).stream()
                .map(UserResponseDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/exists/username/{username}")
    public ResponseEntity<Boolean> checkUsernameExists(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }
}