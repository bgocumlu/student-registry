package com.studentregistry.factory;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;

@Component
public class AuthenticationTokenFactory {

    public List<GrantedAuthority> createAuthorities(String role) {
        // Ensure role doesn't already have ROLE_ prefix to avoid double prefixing
        String normalizedRole = role != null ? role.toUpperCase() : "VIEWER";
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5); // Remove "ROLE_" prefix if present
        }
        return Collections.singletonList(createAuthority("ROLE_" + normalizedRole));
    }

    public GrantedAuthority createAuthority(String authority) {
        return new SimpleGrantedAuthority(authority);
    }

    public UserDetails createUserDetails(String username, List<GrantedAuthority> authorities) {
        return new User(username, "", authorities);
    }

    public UsernamePasswordAuthenticationToken createAuthenticationToken(
            UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = 
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        return authToken;
    }

    public UsernamePasswordAuthenticationToken createLoginAuthenticationToken(
            String username, String password) {
        return new UsernamePasswordAuthenticationToken(username, password);
    }
}