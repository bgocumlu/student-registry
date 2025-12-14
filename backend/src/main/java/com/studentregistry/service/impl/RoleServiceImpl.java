package com.studentregistry.service.impl;

import com.studentregistry.entity.Role;
import com.studentregistry.repository.RoleRepository;
import com.studentregistry.service.RoleService;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll(Sort.by("id"));
    }

    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> getRoleByName(String name) {
        return roleRepository.findByName(name);
    }

    public Role saveRole(Role role) {
        if (roleRepository.existsByName(role.getName())) {
            throw new RuntimeException("Role with name '" + role.getName() + "' already exists");
        }
        return roleRepository.save(role);
    }

    public Role updateRole(Long id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        
        // Check if new name already exists (excluding current role)
        if (!role.getName().equals(roleDetails.getName()) && roleRepository.existsByName(roleDetails.getName())) {
            throw new RuntimeException("Role with name '" + roleDetails.getName() + "' already exists");
        }
        
        role.setName(roleDetails.getName());
        return roleRepository.save(role);
    }

    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }
}