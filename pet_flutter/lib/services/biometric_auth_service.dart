import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

class BiometricAuthService {
  final LocalAuthentication _auth = LocalAuthentication();

  /// Kiểm tra xem thiết bị có hỗ trợ sinh trắc học không
  Future<bool> isDeviceSupported() async {
    try {
      return await _auth.isDeviceSupported();
    } catch (e) {
      return false;
    }
  }

  /// Kiểm tra xem có thể sử dụng sinh trắc học không
  Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (e) {
      return false;
    }
  }

  /// Lấy danh sách các phương thức sinh trắc học có sẵn
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  /// Xác thực bằng sinh trắc học (vân tay, Face ID, etc.)
  /// 
  /// Returns:
  /// - true: Xác thực thành công
  /// - false: Xác thực thất bại hoặc người dùng hủy
  /// 
  /// Throws:
  /// - PlatformException nếu có lỗi hệ thống
  Future<AuthResult> authenticate({
    String localizedReason = 'Xác thực để đăng nhập',
    bool biometricOnly = true,
  }) async {
    try {
      final bool authenticated = await _auth.authenticate(
        localizedReason: localizedReason,
        persistAcrossBackgrounding: true,
      );
      
      return AuthResult(
        success: authenticated,
        errorCode: authenticated ? null : 'authentication_failed',
        errorMessage: authenticated ? null : 'Xác thực thất bại',
      );
    } on LocalAuthException catch (e) {
      // Xử lý các lỗi cụ thể từ LocalAuthException
      String errorMessage = 'Lỗi xác thực';
      
      // Xử lý theo code name
      final code = e.code.name;
      if (code.contains('notAvailable') || code.contains('NotAvailable')) {
        errorMessage = 'Sinh trắc học không khả dụng trên thiết bị này';
      } else if (code.contains('notEnrolled') || code.contains('NotEnrolled')) {
        errorMessage = 'Chưa thiết lập sinh trắc học. Vui lòng cài đặt vân tay trong Cài đặt thiết bị';
      } else if (code.contains('passcodeNotSet') || code.contains('PasscodeNotSet')) {
        errorMessage = 'Chưa thiết lập mã khóa thiết bị';
      } else if (code.contains('lockedOut') || code.contains('LockedOut')) {
        if (code.contains('permanently') || code.contains('Permanently')) {
          errorMessage = 'Xác thực bị khóa vĩnh viễn. Vui lòng mở khóa thiết bị';
        } else {
          errorMessage = 'Xác thực bị khóa do quá nhiều lần thử sai';
        }
      } else if (code.contains('userCanceled') || code.contains('UserCanceled') || 
                 code.contains('systemCanceled') || code.contains('SystemCanceled')) {
        errorMessage = 'Xác thực bị hủy';
      } else {
        errorMessage = e.description ?? 'Lỗi không xác định';
      }
      
      return AuthResult(
        success: false,
        errorCode: e.code.name,
        errorMessage: errorMessage,
      );
    } on PlatformException catch (e) {
      return AuthResult(
        success: false,
        errorCode: e.code,
        errorMessage: e.message ?? 'Lỗi không xác định',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        errorCode: 'unknown_error',
        errorMessage: 'Đã xảy ra lỗi: ${e.toString()}',
      );
    }
  }

  /// Hủy xác thực đang diễn ra
  Future<void> stopAuthentication() async {
    try {
      await _auth.stopAuthentication();
    } catch (e) {
      // Ignore errors when stopping
    }
  }

  /// Kiểm tra xem thiết bị có hỗ trợ vân tay không
  Future<bool> hasFingerprintSupport() async {
    try {
      final availableBiometrics = await getAvailableBiometrics();
      return availableBiometrics.contains(BiometricType.fingerprint);
    } catch (e) {
      return false;
    }
  }

  /// Kiểm tra xem thiết bị có hỗ trợ Face ID không
  Future<bool> hasFaceIdSupport() async {
    try {
      final availableBiometrics = await getAvailableBiometrics();
      return availableBiometrics.contains(BiometricType.face);
    } catch (e) {
      return false;
    }
  }

  /// Lấy tên phương thức sinh trắc học có sẵn
  Future<String> getBiometricTypeName() async {
    try {
      final availableBiometrics = await getAvailableBiometrics();
      if (availableBiometrics.isEmpty) {
        return 'Không có';
      }
      
      if (availableBiometrics.contains(BiometricType.face)) {
        return 'Face ID';
      } else if (availableBiometrics.contains(BiometricType.fingerprint)) {
        return 'Vân tay';
      } else if (availableBiometrics.contains(BiometricType.iris)) {
        return 'Mống mắt';
      } else if (availableBiometrics.contains(BiometricType.strong)) {
        return 'Sinh trắc học mạnh';
      } else if (availableBiometrics.contains(BiometricType.weak)) {
        return 'Sinh trắc học yếu';
      }
      
      return 'Sinh trắc học';
    } catch (e) {
      return 'Không xác định';
    }
  }
}

/// Kết quả xác thực
class AuthResult {
  final bool success;
  final String? errorCode;
  final String? errorMessage;

  AuthResult({
    required this.success,
    this.errorCode,
    this.errorMessage,
  });

  bool get isUserCanceled => 
      errorCode == 'UserCancel' || 
      errorCode == 'user_canceled' ||
      errorCode == 'SystemCancel' ||
      errorCode == 'system_canceled';
}
