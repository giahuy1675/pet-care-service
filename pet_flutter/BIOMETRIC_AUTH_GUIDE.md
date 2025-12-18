# Hướng Dẫn Sử Dụng Tính Năng Đăng Nhập Bằng Vân Tay

## Tổng Quan
Tính năng đăng nhập bằng vân tay (biometric authentication) cho phép người dùng đăng nhập nhanh chóng và an toàn bằng cách sử dụng vân tay, Face ID hoặc các phương thức sinh trắc học khác được hỗ trợ bởi thiết bị.

## Các File Đã Được Tạo/Chỉnh Sửa

### 1. Service Files
- **`lib/services/biometric_auth_service.dart`** (Mới)
  - Service quản lý xác thực sinh trắc học
  - Kiểm tra khả năng hỗ trợ của thiết bị
  - Thực hiện xác thực vân tay/Face ID
  - Xử lý các lỗi liên quan đến sinh trắc học

- **`lib/services/secure_storage.dart`** (Đã cập nhật)
  - Thêm methods lưu trữ cài đặt biometric
  - Lưu trữ thông tin đăng nhập an toàn (encrypted)
  - Methods: `saveBiometricEnabled`, `isBiometricEnabled`, `saveBiometricCredentials`, etc.

### 2. Page Files
- **`lib/pages/profile_page.dart`** (Đã cập nhật)
  - Thêm toggle bật/tắt xác thực sinh trắc học
  - Dialog cài đặt bảo mật với tùy chọn biometric
  - UI hiển thị trạng thái và loại sinh trắc học

- **`lib/pages/login_page.dart`** (Đã cập nhật)
  - Thêm nút đăng nhập bằng vân tay
  - Tự động hiển thị khi biometric được bật
  - Xử lý luồng đăng nhập biometric

### 3. Dependencies
- **`pubspec.yaml`** (Đã cập nhật)
  - Thêm `local_auth: ^3.0.0`

## Cách Sử Dụng

### Bước 1: Bật Tính Năng Vân Tay (Cho Người Dùng)

1. **Đăng nhập vào ứng dụng** bằng tài khoản thông thường
2. **Vào trang Profile** (tab Profile trong bottom navigation)
3. **Chọn "Bảo mật"** trong phần Thông tin cá nhân
4. **Bật toggle "Đăng nhập bằng [Vân tay/Face ID]"**
5. Nếu chưa lưu thông tin đăng nhập:
   - Nhập email và mật khẩu hiện tại
   - Xác thực bằng vân tay/Face ID
6. Nếu đã lưu thông tin:
   - Chỉ cần xác thực bằng vân tay/Face ID để bật

### Bước 2: Sử Dụng Đăng Nhập Vân Tay

1. **Đăng xuất** khỏi ứng dụng
2. Vào **màn hình đăng nhập**
3. Bạn sẽ thấy **nút "Đăng nhập bằng [Vân tay/Face ID]"** màu gradient tím-xanh
4. **Nhấn vào nút** và xác thực bằng vân tay/Face ID
5. Đăng nhập thành công!

### Tắt Tính Năng

1. Vào trang **Profile > Bảo mật**
2. **Tắt toggle** "Đăng nhập bằng [Vân tay/Face ID]"
3. Tính năng sẽ được tắt ngay lập tức

## Yêu Cầu Thiết Bị

### Android
- **Phiên bản tối thiểu**: Android 6.0 (API level 23)
- **Yêu cầu**: Thiết bị phải có cảm biến vân tay hoặc hỗ trợ face unlock
- **Cài đặt**: Phải thiết lập ít nhất một vân tay trong Settings > Security

### iOS
- **Phiên bản tối thiểu**: iOS 10.0+
- **Yêu cầu**: Touch ID hoặc Face ID
- **Cài đặt**: Phải thiết lập Touch ID/Face ID trong Settings

### Permissions Required

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
<uses-permission android:name="android.permission.USE_FINGERPRINT"/>
```

#### iOS (`ios/Runner/Info.plist`)
```xml
<key>NSFaceIDUsageDescription</key>
<string>Cần truy cập Face ID để đăng nhập nhanh và an toàn</string>
```

## Bảo Mật

### Cách Thức Lưu Trữ
- **Thông tin đăng nhập** được lưu trữ an toàn sử dụng `flutter_secure_storage`
- **Mã hóa**: Sử dụng Keychain (iOS) và KeyStore (Android)
- **Không thể truy cập**: Các ứng dụng khác không thể đọc dữ liệu

### Xác Thực 2 Lớp
1. **Lớp 1**: Xác thực sinh trắc học (vân tay/Face ID)
2. **Lớp 2**: Thông tin đăng nhập được mã hóa trong secure storage

### Xử Lý Lỗi
- **Thiết bị không hỗ trợ**: Toggle sẽ bị disable
- **Chưa thiết lập vân tay**: Hiển thị thông báo hướng dẫn
- **Xác thực thất bại**: Cho phép thử lại
- **Quá nhiều lần thất bại**: Khóa tạm thời theo cài đặt thiết bị

## API Reference

### BiometricAuthService

#### Methods

```dart
// Kiểm tra thiết bị có hỗ trợ không
Future<bool> isDeviceSupported()

// Kiểm tra có thể sử dụng biometric không
Future<bool> canCheckBiometrics()

// Lấy danh sách biometric có sẵn
Future<List<BiometricType>> getAvailableBiometrics()

// Xác thực
Future<AuthResult> authenticate({
  String localizedReason = 'Xác thực để đăng nhập',
  bool biometricOnly = true,
})

// Hủy xác thực
Future<void> stopAuthentication()

// Kiểm tra hỗ trợ vân tay
Future<bool> hasFingerprintSupport()

// Kiểm tra hỗ trợ Face ID
Future<bool> hasFaceIdSupport()

// Lấy tên loại biometric
Future<String> getBiometricTypeName()
```

#### AuthResult

```dart
class AuthResult {
  final bool success;           // Thành công hay không
  final String? errorCode;      // Mã lỗi nếu thất bại
  final String? errorMessage;   // Thông báo lỗi
  
  bool get isUserCanceled;      // Người dùng hủy
}
```

### SecureStorageService (Biometric Methods)

```dart
// Lưu trạng thái bật/tắt
Future<void> saveBiometricEnabled(bool enabled)

// Đọc trạng thái
Future<bool> isBiometricEnabled()

// Lưu thông tin đăng nhập
Future<void> saveBiometricCredentials(String email, String password)

// Đọc email
Future<String?> getBiometricEmail()

// Đọc password
Future<String?> getBiometricPassword()

// Xóa thông tin biometric
Future<void> clearBiometricCredentials()
```

## Testing

### Test Trên Simulator/Emulator

#### Android Emulator
1. Mở **Settings** trong emulator
2. Vào **Security > Fingerprint**
3. Thêm một vân tay giả lập
4. Trong Android Studio, sử dụng **Extended Controls > Fingerprint** để test

#### iOS Simulator
1. **Hardware > Touch ID/Face ID > Enrolled**
2. Test xác thực: **Hardware > Touch ID/Face ID > Matching Touch/Face**
3. Test thất bại: **Hardware > Touch ID/Face ID > Non-matching Touch/Face**

### Test Trên Thiết Bị Thật
- Khuyến nghị test trên thiết bị thật để trải nghiệm chính xác
- Đảm bảo đã thiết lập vân tay/Face ID trên thiết bị

## Troubleshooting

### Lỗi Thường Gặp

#### "Sinh trắc học không khả dụng"
- **Nguyên nhân**: Thiết bị không hỗ trợ hoặc chưa thiết lập
- **Giải pháp**: Vào Settings thiết bị và thiết lập vân tay/Face ID

#### "Chưa thiết lập sinh trắc học"
- **Nguyên nhân**: Chưa đăng ký vân tay/Face ID trong Settings
- **Giải pháp**: Vào Settings > Security (Android) hoặc Settings > Face ID & Passcode (iOS)

#### "Xác thực bị khóa"
- **Nguyên nhân**: Quá nhiều lần xác thực sai
- **Giải pháp**: Đợi hoặc mở khóa thiết bị bằng PIN/Password

#### Toggle không hiển thị
- **Nguyên nhân**: Thiết bị không hỗ trợ
- **Giải pháp**: Kiểm tra phiên bản Android/iOS và hardware

## Best Practices

### Cho Developer
1. **Luôn kiểm tra** `isDeviceSupported()` trước khi hiển thị UI
2. **Xử lý lỗi** gracefully với thông báo rõ ràng
3. **Cung cấp fallback** với đăng nhập thông thường
4. **Không bắt buộc** người dùng phải dùng biometric
5. **Test trên nhiều thiết bị** khác nhau

### Cho Người Dùng
1. **Chỉ bật** trên thiết bị cá nhân
2. **Không chia sẻ** thiết bị có bật biometric
3. **Cập nhật vân tay** nếu thay đổi trong Settings
4. **Tắt tính năng** nếu cần cho thiết bị khác mượn

## Tính Năng Nâng Cao (Có Thể Thêm Sau)

- ✅ Xác thực sinh trắc học cơ bản
- ✅ Lưu trữ thông tin an toàn
- ✅ Toggle bật/tắt trong Profile
- ✅ Tích hợp vào Login flow
- ⏳ Timeout tự động đăng xuất
- ⏳ Biometric cho các hành động quan trọng (thanh toán, etc.)
- ⏳ Thông báo khi có lần đăng nhập thất bại
- ⏳ Log lịch sử xác thực

## Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần Troubleshooting
2. Xem logs trong console
3. Liên hệ team phát triển

---

**Phát triển bởi**: Pet Care Team  
**Phiên bản**: 1.0.0  
**Ngày cập nhật**: December 2025
