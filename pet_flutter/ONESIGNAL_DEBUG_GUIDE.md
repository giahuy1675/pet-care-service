# OneSignal Notification Debug Guide

## Vấn đề: Không nhận được thông báo khi đặt lịch

### Nguyên nhân có thể:
1. ❌ External User ID chưa được set
2. ❌ User chưa đăng nhập lại sau khi thêm code
3. ❌ OneSignal Player ID chưa được tạo
4. ❌ REST API Key hoặc App ID sai

---

## ✅ Giải pháp đã thực hiện:

### 1. Set External User ID khi Login
**File:** `lib/pages/login_page.dart`
```dart
// Sau khi login thành công
await OneSignalService().setExternalUserId(userId);
```

### 2. Set External User ID khi App khởi động
**File:** `lib/pages/auth_wrapper.dart`
```dart
// Khi check auth status
if (userId != null) {
  await OneSignalService().setExternalUserId(userId);
}
```

### 3. Gửi notification sau khi đặt lịch
**File:** `lib/pages/appointment_booking_page.dart`
```dart
await OneSignalNotificationHelper.sendNotificationToUser(
  userId: userId,
  title: '🎉 Đặt lịch thành công!',
  message: 'Lịch hẹn ... đã được tạo.',
);
```

---

## 🔍 Cách kiểm tra:

### Bước 1: Xóa app và cài lại (hoặc clear data)
```bash
flutter clean
flutter pub get
flutter run
```

### Bước 2: Đăng nhập lại
- Đăng xuất khỏi app (nếu đang đăng nhập)
- Đăng nhập lại
- Kiểm tra log console:
  ```
  🔔 [OneSignal] External User ID set: 123
  ```

### Bước 3: Kiểm tra OneSignal Player ID
Xem log khi app khởi động:
```
🔔 [OneSignal] Initialization complete. Player ID: abc-xyz-123
```

### Bước 4: Đặt lịch hẹn
- Đặt lịch hẹn mới
- Kiểm tra log:
  ```
  🔔 [OneSignal] Sending notification to user: 123
  ✅ [OneSignal] Notification sent successfully!
  ```

### Bước 5: Kiểm tra notification bar
- Kéo xuống notification bar
- Phải thấy notification "🎉 Đặt lịch thành công!"

---

## 🐛 Debug Commands:

### Xem tất cả log OneSignal:
```bash
flutter run | grep OneSignal
```

### Xem log đặt lịch:
```bash
flutter run | grep Booking
```

### Clear app data (Android):
```bash
adb shell pm clear com.example.pet_flutter
```

---

## 📱 Test trên OneSignal Dashboard:

1. Vào https://app.onesignal.com
2. Chọn app "Pet App"
3. Vào **Audience** > **All Users**
4. Kiểm tra xem có user với External User ID không
5. Nếu không có → External User ID chưa được set

---

## ⚠️ Lưu ý quan trọng:

1. **Phải đăng nhập lại** sau khi thêm code set External User ID
2. **Phải có internet** để nhận notification
3. **Phải bật notification permission** trong Settings
4. External User ID = User ID từ backend (ví dụ: "123", "456")
5. Player ID ≠ External User ID (Player ID do OneSignal tự tạo)

---

## 🔧 Troubleshooting:

### Không thấy log "External User ID set"
→ Đăng xuất và đăng nhập lại

### Thấy log "Notification sent successfully" nhưng không nhận được
→ Kiểm tra:
- Notification permission đã bật chưa
- External User ID có khớp với userId trong code không
- Vào OneSignal Dashboard xem notification có được gửi không

### Response: "Invalid external_user_ids"
→ External User ID chưa được set hoặc sai format

### Response: "Invalid player_ids"  
→ Player ID chưa được tạo (app chưa được mở hoặc OneSignal chưa init)

---

## ✅ Expected Flow:

1. App starts → OneSignal init → Player ID created
2. User login → External User ID set = User ID from backend
3. User books appointment → Send notification to External User ID
4. OneSignal finds Player ID linked to External User ID
5. Notification delivered to device ✅
