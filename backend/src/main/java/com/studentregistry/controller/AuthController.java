package com.studentregistry.controller;

import com.studentregistry.dto.LoginRequest;
import com.studentregistry.dto.ChangePasswordRequest;
import com.studentregistry.dto.SetupAdminDTO;
import com.studentregistry.dto.LoginResponse;
import com.studentregistry.dto.UserResponseDTO;
import com.studentregistry.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "User login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                .body(new com.studentregistry.dto.ErrorResponse(401, "Invalid credentials", "/api/auth/login"));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout")
    public ResponseEntity<?> logout() {
        // For JWT, logout is handled client-side by removing the token
        // This endpoint exists for API compatibility
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
        try {
            UserResponseDTO user = authService.getCurrentUser(authentication);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            authService.changePassword(request, authentication);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/setup-admin")
    @Operation(summary = "Setup admin role and admin user (unprotected endpoint)")
    public ResponseEntity<?> setupAdmin(@Valid @RequestBody SetupAdminDTO setupAdminDTO) {
        try {
            UserResponseDTO adminUser = authService.setupAdmin(setupAdminDTO);
            return ResponseEntity.ok(adminUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(new com.studentregistry.dto.ErrorResponse(400, e.getMessage(), "/api/auth/setup-admin"));
        }
    }
}