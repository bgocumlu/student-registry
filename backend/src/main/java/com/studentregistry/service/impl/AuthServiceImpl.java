package com.studentregistry.service.impl;

import com.studentregistry.dto.LoginRequest;
import com.studentregistry.dto.ChangePasswordRequest;
import com.studentregistry.dto.LoginResponse;
import com.studentregistry.dto.SetupAdminDTO;
import com.studentregistry.dto.UserResponseDTO;
import com.studentregistry.entity.Role;
import com.studentregistry.entity.User;
import com.studentregistry.factory.AuthenticationTokenFactory;
import com.studentregistry.repository.RoleRepository;
import com.studentregistry.repository.UserRepository;
import com.studentregistry.util.JwtUtil;
import com.studentregistry.service.AuthService;
import com.studentregistry.service.LogService;

import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final AuthenticationTokenFactory tokenFactory;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public AuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            AuthenticationTokenFactory tokenFactory, LogService logService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.tokenFactory = tokenFactory;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public LoginResponse login(LoginRequest loginRequest) {
        try {
            // Authenticate using Spring Security's AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    tokenFactory.createLoginAuthenticationToken(loginRequest.getUsername(),
                            loginRequest.getPassword()));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Get user from database to access role information
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate JWT token - ensure role name is uppercase for consistency
            String roleName = user.getRole() != null ? user.getRole().getName().toUpperCase() : "VIEWER";
            String token = jwtUtil.generateToken(userDetails, roleName);
            UserResponseDTO userResponse = new UserResponseDTO(user);

            return new LoginResponse(token, userResponse);
        } catch (Exception e) {
            throw new RuntimeException("Invalid credentials");
        }
    }

    public UserResponseDTO getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserResponseDTO(user);
    }

    public void changePassword(ChangePasswordRequest request, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid old password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "userId", user.getId(),
                    "username", username));
            logService.logActionByUsername(username, "CHANGE_PASSWORD", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
    }

    public UserResponseDTO setupAdmin(SetupAdminDTO setupAdminDTO) {
        // Check if admin user already exists
        if (userRepository.existsByEmail(setupAdminDTO.getEmail()) ||
                userRepository.existsByUsername(setupAdminDTO.getUsername())) {
            throw new RuntimeException("Admin user already exists");
        }

        // Check if any admin user exists (by role)
        if (!userRepository.findByRole_Name("ADMIN", Sort.by("id")).isEmpty()) {
            throw new RuntimeException("An admin user already exists in the system");
        }

        // Get or create ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    Role role = new Role("ADMIN");
                    return roleRepository.save(role);
                });

        // Create TEACHER role
        roleRepository.findByName("TEACHER")
                .orElseGet(() -> {
                    Role role = new Role("TEACHER");
                    return roleRepository.save(role);
                });

        // Create admin user
        User adminUser = new User();
        adminUser.setUsername(setupAdminDTO.getUsername());
        adminUser.setEmail(setupAdminDTO.getEmail());
        adminUser.setPasswordHash(passwordEncoder.encode(setupAdminDTO.getPassword()));
        adminUser.setRole(adminRole);
        adminUser.setStatus(User.Status.ACTIVE);

        User savedUser = userRepository.save(adminUser);

        try {
            String details = objectMapper.writeValueAsString(Map.of(
                    "userId", savedUser.getId(),
                    "username", savedUser.getUsername(),
                    "email", savedUser.getEmail(),
                    "role", "ADMIN"));
            logService.logActionByUsername("SYSTEM", "SETUP_ADMIN", details);
        } catch (Exception e) {
            // Logging failure shouldn't break the operation
        }
        return new UserResponseDTO(savedUser);
    }
}
