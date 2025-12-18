import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> readToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<void> saveUser(String userJson) async {
    await _storage.write(key: _userKey, value: userJson);
  }

  Future<String?> readUser() async {
    return _storage.read(key: _userKey);
  }

  Future<String?> readUserId() async {
    final userJson = await readUser();
    if (userJson != null) {
      try {
        final user = json.decode(userJson);
        return user['userId']?.toString() ?? user['id']?.toString();
      } catch (e) {
      }
    }
    return null;
  }

  Future<String?> readUserName() async {
    final userJson = await readUser();
    if (userJson != null) {
      try {
        final user = json.decode(userJson);
        return user['fullName'] ?? user['name'] ?? user['userName'];
      } catch (e) {
      }
    }
    return null;
  }

  Future<String?> readUserRole() async {
    final userJson = await readUser();
    if (userJson != null) {
      try {
        final user = json.decode(userJson);
        return user['role'] ?? 'Customer';
      } catch (e) {
      }
    }
    return 'Customer';
  }

  Future<String?> readStaffId() async {
    final userJson = await readUser();
    if (userJson != null) {
      try {
        final user = json.decode(userJson);
        // Ưu tiên staffId, nếu không có thì dùng userId
        return user['staffId']?.toString() ?? user['userId']?.toString();
      } catch (e) {
      }
    }
    return null;
  }

  // Biometric Authentication Settings
  static const String _biometricEnabledKey = 'biometric_enabled';
  static const String _biometricEmailKey = 'biometric_email';
  static const String _biometricPasswordKey = 'biometric_password';

  /// Lưu thiết lập bật/tắt xác thực sinh trắc học
  Future<void> saveBiometricEnabled(bool enabled) async {
    await _storage.write(key: _biometricEnabledKey, value: enabled.toString());
  }

  /// Đọc thiết lập xác thực sinh trắc học
  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: _biometricEnabledKey);
    return value == 'true';
  }

  /// Lưu thông tin đăng nhập cho xác thực sinh trắc học
  Future<void> saveBiometricCredentials(String email, String password) async {
    await _storage.write(key: _biometricEmailKey, value: email);
    await _storage.write(key: _biometricPasswordKey, value: password);
  }

  /// Đọc email đã lưu cho xác thực sinh trắc học
  Future<String?> getBiometricEmail() async {
    return await _storage.read(key: _biometricEmailKey);
  }

  /// Đọc password đã lưu cho xác thực sinh trắc học
  Future<String?> getBiometricPassword() async {
    return await _storage.read(key: _biometricPasswordKey);
  }

  /// Xóa thông tin xác thực sinh trắc học
  Future<void> clearBiometricCredentials() async {
    await _storage.delete(key: _biometricEnabledKey);
    await _storage.delete(key: _biometricEmailKey);
    await _storage.delete(key: _biometricPasswordKey);
  }

  /// Xóa tất cả dữ liệu (bao gồm cả biometric)
  Future<void> clear() async {
    await _storage.deleteAll();
  }

  /// Xóa chỉ dữ liệu đăng nhập (GIỮ LẠI thông tin biometric)
  Future<void> clearAuthData() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}


