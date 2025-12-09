# Hướng Dẫn Khắc Phục Thông Báo Tự Động

## 🔧 Các Thay Đổi Đã Thực Hiện

### 1. Cập Nhật Dependencies (pubspec.yaml)
```yaml
# Cũ:
flutter_local_notifications: ^17.0.0
timezone: ^0.9.4

# Mới:
flutter_local_notifications: ^19.5.0
timezone: ^0.10.0
```

**Lý do**: Phiên bản 19.5.0 có nhiều cải tiến về scheduled notifications và khắc phục lỗi trên Android 12+

### 2. Cập Nhật AndroidManifest.xml

#### a. Thêm Permission RECEIVE_BOOT_COMPLETED
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```
**Mục đích**: Cho phép app khôi phục lại thông báo đã lên lịch sau khi thiết bị khởi động lại

#### b. Thêm Broadcast Receivers
```xml
<!-- Receiver xử lý scheduled notifications -->
<receiver android:exported="false" 
          android:name="com.dexterous.flutterlocalnotifications.ScheduledNotificationReceiver" />

<!-- Receiver khôi phục notifications sau khi reboot -->
<receiver android:exported="false" 
          android:name="com.dexterous.flutterlocalnotifications.ScheduledNotificationBootReceiver">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED"/>
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
        <action android:name="com.htc.intent.action.QUICKBOOT_POWERON"/>
    </intent-filter>
</receiver>
```

**Giải thích**:
- `ScheduledNotificationReceiver`: Nhận và hiển thị thông báo khi đến giờ đã lên lịch
- `ScheduledNotificationBootReceiver`: Khôi phục các thông báo đã lên lịch sau khi thiết bị reboot
- `android:exported="false"`: Chỉ cho phép app của mình sử dụng receivers này

### 3. Cải Tiến Code (appointment_reminder_service.dart)

#### a. Thêm Method Kiểm Tra Pending Notifications
```dart
Future<void> checkPendingNotifications() async {
  final List<PendingNotificationRequest> pendingNotifications = 
      await _notificationsPlugin.pendingNotificationRequests();
  
  print('📋 Total pending notifications: ${pendingNotifications.length}');
  for (final notification in pendingNotifications) {
    print('  - ID: ${notification.id}, Title: ${notification.title}');
  }
}
```

**Công dụng**: Cho phép kiểm tra xem có bao nhiêu thông báo đang chờ được gửi

#### b. Enhanced Logging
- Thêm log chi tiết khi schedule từng reminder
- Log thời gian hiện tại vs thời gian appointment
- Log danh sách pending notifications sau khi schedule

## 📱 Cách Sử Dụng Sau Khi Cập Nhật

### Bước 1: Clean và Rebuild App
```bash
flutter clean
flutter pub get
flutter run
```

**Quan trọng**: Phải rebuild hoàn toàn app vì AndroidManifest.xml đã thay đổi!

### Bước 2: Kiểm Tra Permissions
Khi app chạy lần đầu sau khi cập nhật, hãy kiểm tra:
1. ✅ Permission "Schedule exact alarm" đã được cấp
2. ✅ Permission "Post notifications" đã được cấp
3. ✅ Không có lỗi permission nào trong log

### Bước 3: Test Thông Báo
1. Tạo một lịch hẹn mới
2. Kiểm tra log console:
   ```
   ✅ Scheduled 1h reminder at ...
   ✅ Scheduled 30m reminder at ...
   ✅ Scheduled 10m reminder at ...
   ✅ Scheduled on-time reminder at ...
   📋 Total pending notifications: 4
   ```
3. Đợi đến giờ thông báo để xác nhận có hiển thị

### Bước 4: Kiểm Tra Pending Notifications
Bạn có thể gọi method này bất cứ lúc nào:
```dart
await AppointmentReminderService().checkPendingNotifications();
```

## 🔍 Troubleshooting

### Vấn Đề 1: Thông báo không hiển thị
**Kiểm tra**:
- [ ] Permission "Schedule exact alarm" đã được cấp?
- [ ] App đã được rebuild sau khi thay đổi AndroidManifest?
- [ ] Thời gian lịch hẹn có lớn hơn thời gian hiện tại?
- [ ] Check log xem có lỗi khi schedule không?

### Vấn Đề 2: Thông báo mất sau khi reboot
**Nguyên nhân**: RECEIVE_BOOT_COMPLETED permission chưa được cấp hoặc receivers chưa được khai báo

**Giải pháp**: Đảm bảo AndroidManifest.xml có đầy đủ như trên và rebuild app

### Vấn Đề 3: Permission bị từ chối
**Android 12+**: Nếu user từ chối "Schedule exact alarm", app sẽ mở Settings để user cấp quyền thủ công

**Cách xử lý**:
```dart
if (!alarmStatus.isGranted) {
  await openAppSettings();
}
```

## 📊 So Sánh Trước & Sau

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Version flutter_local_notifications | 17.0.0 | 19.5.0 |
| Scheduled notifications | ❌ Không hoạt động | ✅ Hoạt động |
| Restore sau reboot | ❌ Không | ✅ Có |
| Debug logging | ⚠️ Cơ bản | ✅ Chi tiết |
| Pending notifications check | ❌ Không | ✅ Có |

## 🎯 Kết Luận

Các vấn đề chính đã được khắc phục:
1. ✅ Cập nhật lên version mới nhất với bug fixes
2. ✅ Thêm đầy đủ receivers trong AndroidManifest.xml
3. ✅ Thêm permission RECEIVE_BOOT_COMPLETED
4. ✅ Enhanced logging để debug dễ dàng
5. ✅ Method kiểm tra pending notifications

**Lưu ý quan trọng**: 
- Phải rebuild app hoàn toàn (không chỉ hot restart)
- Phải test trên thiết bị thật hoặc emulator có Google Play Services
- Thông báo sẽ không hiển thị nếu app đã bị force stop bởi hệ thống
