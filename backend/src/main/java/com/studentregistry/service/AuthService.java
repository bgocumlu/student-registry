package com.studentregistry.service;

import com.studentregistry.dto.ChangePasswordRequest;
import com.studentregistry.dto.LoginRequest;
import com.studentregistry.dto.LoginResponse;
import com.studentregistry.dto.SetupAdminDTO;
import com.studentregistry.dto.UserResponseDTO;
import org.springframework.security.core.Authentication;

public interface AuthService {
    LoginResponse login(LoginRequest loginRequest);

    UserResponseDTO getCurrentUser(Authentication authentication);

    void changePassword(ChangePasswordRequest request, Authentication authentication);

    UserResponseDTO setupAdmin(SetupAdminDTO setupAdminDTO);
}
