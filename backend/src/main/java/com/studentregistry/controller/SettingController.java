package com.studentregistry.controller;

import com.studentregistry.entity.Setting;
import com.studentregistry.service.SettingService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public List<Setting> getAllSettings() {
        return settingService.getAllSettings();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Setting> getSettingById(@PathVariable Long id) {
        return settingService.getSettingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/key/{key}")
    public ResponseEntity<Setting> getSettingByKey(@PathVariable String key) {
        return settingService.getSettingByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Setting createSetting(@RequestBody Setting setting) {
        return settingService.saveSetting(setting);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Setting> updateSetting(@PathVariable Long id, @RequestBody Setting settingDetails) {
        try {
            Setting updatedSetting = settingService.updateSetting(id, settingDetails);
            return ResponseEntity.ok(updatedSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/key/{key}")
    public Setting updateSettingByKey(@PathVariable String key, @RequestBody String value, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return settingService.updateSettingByKey(key, value, username);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSetting(@PathVariable Long id) {
        try {
            settingService.deleteSetting(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/key/{key}")
    public ResponseEntity<?> deleteSettingByKey(@PathVariable String key) {
        try {
            settingService.deleteSettingByKey(key);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exists/{key}")
    public ResponseEntity<Boolean> checkSettingExists(@PathVariable String key) {
        boolean exists = settingService.existsByKey(key);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/value/{key}")
    public ResponseEntity<String> getSettingValue(@PathVariable String key,
            @RequestParam(defaultValue = "") String defaultValue) {
        String value = settingService.getSettingValue(key, defaultValue);
        return ResponseEntity.ok(value);
    }

    @GetMapping("/current-semester")
    public ResponseEntity<Setting> getCurrentSemester() {
        return settingService.getSettingByKey("current_semester")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/current-semester")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setCurrentSemester(@RequestBody SemesterUpdateRequest request, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            settingService.updateSettingByKey("current_semester", request.getSemester(), username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Inner class for semester update request
    public static class SemesterUpdateRequest {
        private String semester;
        
        public String getSemester() {
            return semester;
        }
        
        public void setSemester(String semester) {
            this.semester = semester;
        }
    }
}