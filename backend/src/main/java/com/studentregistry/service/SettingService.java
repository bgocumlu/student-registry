package com.studentregistry.service;

import com.studentregistry.entity.Setting;

import java.util.List;
import java.util.Optional;

public interface SettingService {
    List<Setting> getAllSettings();

    Optional<Setting> getSettingById(Long id);

    Optional<Setting> getSettingByKey(String key);

    Setting saveSetting(Setting setting);

    Setting updateSetting(Long id, Setting settingDetails);

    Setting updateSettingByKey(String key, String value, String username);

    void deleteSetting(Long id);

    void deleteSettingByKey(String key);

    boolean existsByKey(String key);

    String getSettingValue(String key, String defaultValue);
}
