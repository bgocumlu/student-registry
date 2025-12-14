package com.studentregistry.service.impl;

import com.studentregistry.entity.Setting;
import com.studentregistry.repository.SettingRepository;
import com.studentregistry.service.LogService;
import com.studentregistry.service.SettingService;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SettingServiceImpl implements SettingService {

    private final SettingRepository settingRepository;
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public SettingServiceImpl(SettingRepository settingRepository, LogService logService) {
        this.settingRepository = settingRepository;
        this.logService = logService;
        this.objectMapper = new ObjectMapper();
    }

    public List<Setting> getAllSettings() {
        return settingRepository.findAll();
    }

    public Optional<Setting> getSettingById(Long id) {
        return settingRepository.findById(id);
    }

    public Optional<Setting> getSettingByKey(String key) {
        return settingRepository.findByKey(key);
    }

    public Setting saveSetting(Setting setting) {
        return settingRepository.save(setting);
    }

    public Setting updateSetting(Long id, Setting settingDetails) {
        Setting setting = settingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Setting not found with id: " + id));
        
        setting.setKey(settingDetails.getKey());
        setting.setValue(settingDetails.getValue());
        
        return settingRepository.save(setting);
    }

    public Setting updateSettingByKey(String key, String value, String username) {
        Optional<Setting> existingSetting = settingRepository.findByKey(key);
        String oldValue = existingSetting.map(Setting::getValue).orElse(null);
        
        Setting saved;
        if (existingSetting.isPresent()) {
            Setting setting = existingSetting.get();
            setting.setValue(value);
            saved = settingRepository.save(setting);
        } else {
            Setting newSetting = new Setting(key, value);
            saved = settingRepository.save(newSetting);
        }
        
        // Log semester updates specifically
        if ("current_semester".equals(key)) {
            try {
                String details = objectMapper.writeValueAsString(Map.of(
                    "key", key,
                    "oldValue", oldValue != null ? oldValue : "null",
                    "newValue", value
                ));
                logService.logActionByUsername(username, "UPDATE_SEMESTER", details);
            } catch (Exception e) {
                // Logging failure shouldn't break the operation
            }
        }
        
        return saved;
    }

    public void deleteSetting(Long id) {
        settingRepository.deleteById(id);
    }

    public void deleteSettingByKey(String key) {
        settingRepository.deleteByKey(key);
    }

    public boolean existsByKey(String key) {
        return settingRepository.existsByKey(key);
    }

    // Utility method to get setting value with default
    public String getSettingValue(String key, String defaultValue) {
        return settingRepository.findByKey(key)
                .map(Setting::getValue)
                .orElse(defaultValue);
    }
}