package com.studentregistry.filter;

import com.studentregistry.factory.AuthenticationTokenFactory;
import com.studentregistry.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AuthenticationTokenFactory tokenFactory;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, AuthenticationTokenFactory tokenFactory) {
        this.jwtUtil = jwtUtil;
        this.tokenFactory = tokenFactory;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");
        
        logger.debug("Processing request: " + request.getRequestURI() + ", Authorization header present: " + (requestTokenHeader != null));

        String username = null;
        String jwtToken = null;

        // JWT Token is in the form "Bearer token"
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwtToken);
                logger.debug("Extracted username from token: " + username);
            } catch (Exception e) {
                logger.error("Unable to get JWT Token for request: " + request.getRequestURI(), e);
            }
        } else if (requestTokenHeader != null) {
            logger.warn("Authorization header present but doesn't start with 'Bearer ' for request: " + request.getRequestURI());
        }

        // Once we get the token validate it
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String role = jwtUtil.extractRole(jwtToken);
                
                // Validate role is not null
                if (role == null || role.isEmpty()) {
                    logger.warn("JWT token does not contain a role for user: " + username);
                    filterChain.doFilter(request, response);
                    return;
                }
                
                // Create UserDetails with the role using factory
                List<GrantedAuthority> authorities = tokenFactory.createAuthorities(role);
                UserDetails userDetails = tokenFactory.createUserDetails(username, authorities);

                // If token is valid configure Spring Security to manually set authentication
                if (jwtUtil.validateToken(jwtToken, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = tokenFactory.createAuthenticationToken(userDetails, request);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Successfully authenticated user: " + username + " with role: " + role + " and authorities: " + authorities);
                } else {
                    logger.warn("JWT token validation failed for user: " + username);
                }
            } catch (Exception e) {
                logger.error("Error processing JWT token for user: " + username + " for request: " + request.getRequestURI(), e);
                // Continue filter chain - let Spring Security handle unauthorized access
            }
        } else if (username == null) {
            logger.debug("No username extracted from token for request: " + request.getRequestURI());
        } else {
            logger.debug("Authentication already exists for request: " + request.getRequestURI());
        }
        filterChain.doFilter(request, response);
    }
}