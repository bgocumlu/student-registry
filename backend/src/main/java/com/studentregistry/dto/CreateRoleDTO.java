package com.studentregistry.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateRoleDTO {
    
    @NotBlank(message = "Role name is required")
    private String name;

    // Constructors
    public CreateRoleDTO() {}

    public CreateRoleDTO(String name) {
        this.name = name;
    }

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}