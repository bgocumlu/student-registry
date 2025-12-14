package com.studentregistry.service;

import com.studentregistry.entity.Role;

import java.util.List;
import java.util.Optional;

public interface RoleService {
    List<Role> getAllRoles();

    Optional<Role> getRoleById(Long id);

    Optional<Role> getRoleByName(String name);

    Role saveRole(Role role);

    Role updateRole(Long id, Role roleDetails);

    void deleteRole(Long id);

    boolean existsByName(String name);
}
