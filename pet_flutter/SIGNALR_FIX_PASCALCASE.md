# SignalR Fix: PascalCase Property Names

## Vấn Đề Gặp Phải

### Triệu chứng:
- SignalR kết nối thành công ✅
- Join room thành công ✅
- Nhưng khi gọi `NotifyTimeSlotSelected` và `NotifyTimeSlotCleared` bị lỗi:
  ```
  InvalidDataException: Error binding arguments
  ```
- Không có sự kiện nào được nhận từ backend
- UI không hiển thị purple border cho slot đang được người khác chọn

### Nguyên nhân:
Backend C# sử dụng **PascalCase** cho property names (RoomKey, TimeSlot, UserId...) nhưng Flutter đang gửi **camelCase** (roomKey, timeSlot, userId...).

## Backend TimeSlotSelectionRequest Model

```csharp
public class TimeSlotSelectionRequest
{
    public string RoomKey { get; set; }        // ❗ PascalCase
    public string TimeSlot { get; set; }       // ❗ PascalCase
    public string UserId { get; set; }         // ❗ PascalCase
    public string UserName { get; set; }       // ❗ PascalCase
    public int? ServiceId { get; set; }        // ❗ int? type
    public int? StaffId { get; set; }          // ❗ int? type
    public string Date { get; set; }           // ❗ PascalCase
}
```

## Các Thay Đổi Đã Thực Hiện

### 1. Sửa `lib/services/signalr_service.dart`

#### Before (❌ Sai):
```dart
final data = {
  'roomKey': roomKey,        // ❌ camelCase
  'timeSlot': timeSlot,      // ❌ camelCase
  'userId': _currentUserId,  // ❌ camelCase
  'userName': _currentUserName,  // ❌ camelCase
  'serviceId': serviceId,    // ❌ String type
  'staffId': staffId,        // ❌ String type
  'date': date,              // ❌ camelCase
};
```

#### After (✅ Đúng):
```dart
// Parse serviceId and staffId to int for backend
final serviceIdInt = int.tryParse(serviceId);
final staffIdInt = int.tryParse(staffId);

// Format data exactly as backend expects - PascalCase to match C# properties
final data = {
  'RoomKey': roomKey,        // ✅ PascalCase - matches C#
  'TimeSlot': timeSlot,      // ✅ PascalCase - matches C#
  'UserId': _currentUserId ?? 'anonymous',  // ✅ PascalCase
  'UserName': _currentUserName ?? 'Anonymous User',  // ✅ PascalCase
  'ServiceId': serviceIdInt, // ✅ int? type - parsed from string
  'StaffId': staffIdInt,     // ✅ int? type - parsed from string
  'Date': date,              // ✅ PascalCase - matches C#
};
```

### 2. Áp dụng cho cả 2 methods:
- ✅ `notifyTimeSlotSelected()` - Updated
- ✅ `notifyTimeSlotCleared()` - Updated

## Cách Test

### Bước 1: Clean và Rebuild
```bash
flutter clean
flutter pub get
flutter run
```

### Bước 2: Test với 2 devices
1. Mở app trên 2 thiết bị hoặc emulator
2. Đăng nhập 2 user khác nhau
3. Vào màn hình đặt lịch
4. Chọn cùng 1 service
5. Chọn cùng 1 staff
6. Chọn cùng 1 ngày

### Bước 3: Kiểm tra logs
```
✅ [SignalR] Connection state changed: connected
✅ [SignalR] Joined time slot room: service_1_staff_2_date_2024-01-15
📤 [DEBUG] Sending data to NotifyTimeSlotSelected: {
  RoomKey: service_1_staff_2_date_2024-01-15,
  TimeSlot: 09:00,
  UserId: user123,
  UserName: Test User,
  ServiceId: 1,
  StaffId: 2,
  Date: 2024-01-15
}
✅ [SignalR] Notified time slot selected: 09:00
```

### Bước 4: Kiểm tra UI
Device 1 chọn khung giờ 09:00:
- ✅ Device 1: Khung giờ 09:00 có green border (chọn)
- ✅ Device 2: Khung giờ 09:00 có **purple pulsing border** + badge "1 người đang chọn"

Device 2 chọn khung giờ 10:00:
- ✅ Device 2: Khung giờ 10:00 có green border (chọn)
- ✅ Device 1: Khung giờ 10:00 có **purple pulsing border** + badge "1 người đang chọn"

## Backend Methods (Đã Tồn Tại)

Backend đã có đầy đủ implementation:

```csharp
// Hubs/TimeSlotSharingHub.cs
public async Task NotifyTimeSlotSelected(TimeSlotSelectionRequest request)
{
    // Store selection in ConcurrentDictionary
    // Broadcast "TimeSlotSelected" event to others in room
    // Auto-clear after 30 seconds
}

public async Task NotifyTimeSlotCleared(TimeSlotSelectionRequest request)
{
    // Remove selection from dictionary
    // Broadcast "TimeSlotCleared" event to others in room
}

// Program.cs
app.MapHub<TimeSlotSharingHub>("/timeSlotHub").RequireCors("AllowLocalhost");
```

## Event Flow

1. User A chọn slot 09:00
   ```
   Flutter → NotifyTimeSlotSelected → Backend Hub
   Backend → TimeSlotSelected event → All users trong room (trừ A)
   Device B nhận event → Update UI purple border
   ```

2. User A deselect hoặc chọn slot khác
   ```
   Flutter → NotifyTimeSlotCleared → Backend Hub
   Backend → TimeSlotCleared event → All users trong room (trừ A)
   Device B nhận event → Remove purple border
   ```

3. Auto-clear sau 30 giây
   ```
   Backend → TimeSlotAutoCleared event → All users
   All devices → Remove purple border
   ```

## Lưu Ý Quan Trọng

### ⚠️ PascalCase vs camelCase
- **C# Backend**: Luôn dùng PascalCase (RoomKey, TimeSlot, UserId)
- **Flutter**: Khi gửi data đến C#, phải dùng PascalCase để match property names
- **SignalR**: Không tự động convert case giữa client và server

### ⚠️ Type Conversion
- C# yêu cầu `int?` cho ServiceId và StaffId
- Flutter phải parse String → int trước khi gửi
- Sử dụng `int.tryParse()` để tránh lỗi nếu string không phải số

### ⚠️ Room Isolation
- Room key format: `service_{serviceId}_staff_{staffId}_date_{YYYY-MM-DD}`
- Chỉ những user trong cùng room mới nhận được events
- Khác service/staff/date = Khác room = Không thấy realtime

## Kết Luận

Vấn đề đã được giải quyết bằng cách:
1. ✅ Sửa property names từ camelCase → PascalCase
2. ✅ Parse serviceId/staffId từ String → int
3. ✅ Đảm bảo đúng định dạng TimeSlotSelectionRequest của backend

Backend đã có đầy đủ implementation, không cần thay đổi gì thêm.
