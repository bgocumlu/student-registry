package com.studentregistry.controller;

import com.studentregistry.dto.CreateRoleDTO;
import com.studentregistry.dto.DTOMapper;
import com.studentregistry.entity.Role;
import com.studentregistry.service.RoleService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleController {

    private final RoleService roleService;
    private final DTOMapper dtoMapper;

    public RoleController(RoleService roleService, DTOMapper dtoMapper) {
        this.roleService = roleService;
        this.dtoMapper = dtoMapper;
    }

    @GetMapping
    public List<Role> getAllRoles() {
        return roleService.getAllRoles();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        return roleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<Role> getRoleByName(@PathVariable String name) {
        return roleService.getRoleByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Role> createRole(@Valid @RequestBody CreateRoleDTO createRoleDTO) {
        try {
            Role role = dtoMapper.toEntity(createRoleDTO);
            Role savedRole = roleService.saveRole(role);
            return ResponseEntity.ok(savedRole);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody Role roleDetails) {
        try {
            Role updatedRole = roleService.updateRole(id, roleDetails);
            return ResponseEntity.ok(updatedRole);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exists/{name}")
    public ResponseEntity<Boolean> checkRoleExists(@PathVariable String name) {
        boolean exists = roleService.existsByName(name);
        return ResponseEntity.ok(exists);
    }
}