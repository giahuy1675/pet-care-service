# 🔔 Hệ Thống Nhắc Lịch Hẹn Tự Động

## ✨ Tính Năng

Hệ thống sẽ tự động gửi **3 lần nhắc nhở** trước mỗi lịch hẹn:

1. **⏰ 1 tiếng trước** - Nhắc nhở đầu tiên
   - "Lịch hẹn dịch vụ {service} cho {pet} sẽ bắt đầu trong 1 tiếng nữa. Hãy chuẩn bị nhé!"

2. **⏳ 30 phút trước** - Nhắc nhở lần 2
   - "Lịch hẹn dịch vụ {service} cho {pet} sẽ bắt đầu trong 30 phút. Đừng quên nhé!"

3. **🚨 10 phút trước** - Nhắc nhở cuối cùng
   - "Lịch hẹn dịch vụ {service} cho {pet} sắp bắt đầu! Hãy đến đúng giờ nhé!"

## 🚀 Cách Hoạt Động

### 1. Tự động khi đặt lịch
```dart
// Khi user đặt lịch hẹn thành công
await AppointmentReminderService().scheduleReminders(
  appointmentId: appointment.appointmentId.toString(),
  appointmentTime: appointment.appointmentDate,
  petName: bookingData.selectedPet?.name ?? 'thú cưng',
  serviceName: bookingData.selectedService?.name ?? 'dịch vụ',
  userId: userId, // Optional - để gửi cho user cụ thể
);
```

### 2. Các file đã tạo

#### `lib/services/appointment_reminder_service.dart`
- Service quản lý reminders
- Sử dụng `Timer` để lên lịch notifications
- Tự động tính toán thời gian còn lại

#### `lib/utils/onesignal_notification_helper.dart`
- Helper gửi OneSignal notifications
- Support gửi cho tất cả users hoặc user cụ thể
- Có thể gửi với custom data

#### `lib/pages/reminder_test_page.dart`
- Trang test reminders
- Chọn thời gian appointment
- Test quick (2 phút)

## 📱 Cách Test

### Test Nhanh (Recommended)
1. Vào **Profile > ⏰ Test Nhắc lịch hẹn**
2. Nhấn **"Test nhanh (2, 1.5, 1 phút)"**
3. Chờ 1 phút → nhận notification đầu tiên
4. Chờ thêm 30 giây → nhận notification thứ 2
5. Chờ thêm 30 giây → nhận notification thứ 3

### Test Với Thời Gian Thực
1. Vào **Profile > ⏰ Test Nhắc lịch hẹn**
2. Chọn thời gian lịch hẹn (ví dụ: 2 giờ sau)
3. Nhấn **"Lên lịch nhắc nhở"**
4. Đợi đến đúng thời điểm để nhận notifications

### Test Với Appointment Thật
1. Đặt lịch hẹn bình thường qua app
2. Hệ thống tự động lên lịch 3 reminders
3. Notifications sẽ được gửi vào đúng thời điểm

## 🔧 Các Chức Năng

### Schedule Reminders
```dart
await AppointmentReminderService().scheduleReminders(
  appointmentId: 'app_123',
  appointmentTime: DateTime(2024, 12, 25, 10, 0), // 10:00 AM
  petName: 'Milu',
  serviceName: 'Khám sức khỏe',
  userId: 'user_456', // Optional
);
```

### Cancel Specific Reminder
```dart
AppointmentReminderService().cancelReminders('app_123');
```

### Cancel All Reminders
```dart
AppointmentReminderService().cancelAllReminders();
```

### Check Active Reminders
```dart
int count = AppointmentReminderService().activeReminderCount;
bool hasReminder = AppointmentReminderService().hasActiveReminders('app_123');
```

## 📋 Lưu Ý

### Thời Gian
- Nếu appointment còn **< 10 phút**: Không lên lịch reminder nào
- Nếu appointment còn **< 30 phút**: Chỉ lên lịch reminder 10 phút
- Nếu appointment còn **< 1 giờ**: Lên lịch reminder 30 phút và 10 phút
- Nếu appointment còn **>= 1 giờ**: Lên lịch đầy đủ 3 reminders

### Notification Data
Mỗi reminder sẽ gửi kèm data:
```dart
{
  'type': 'appointment_reminder',
  'appointment_id': 'app_123',
  'pet_name': 'Milu',
  'service_name': 'Khám sức khỏe',
  'minutes_until': '60', // hoặc '30', '10'
}
```

### User Targeting
- Nếu có `userId`: Gửi notification cho user cụ thể (recommended)
- Nếu không có `userId`: Gửi cho tất cả users (fallback)

## 🎯 Integration Points

### 1. Appointment Booking Page
File: `lib/pages/appointment_booking_page.dart`
- Sau khi tạo appointment thành công
- Tự động schedule reminders

### 2. Profile Page
File: `lib/pages/profile_page.dart`
- Link đến test page
- Vào: Profile > Cài đặt > ⏰ Test Nhắc lịch hẹn

## 🐛 Troubleshooting

### Không nhận được notification?
1. Kiểm tra OneSignal đã khởi tạo chưa
2. Kiểm tra permission notifications
3. Xem log trong console
4. Đảm bảo app đang chạy (timers chỉ hoạt động khi app running)

### Notification đến sai thời gian?
1. Kiểm tra timezone của device
2. Verify appointment time đúng
3. Check logs để xem scheduled time

### Cancel không hoạt động?
1. Đảm bảo dùng đúng `appointmentId`
2. Timers chỉ có thể cancel nếu chưa trigger

## 📊 Logs

Service sẽ print logs để debug:
```
📅 [Reminder] Scheduling reminders for appointment: app_123
⏰ [Reminder] Scheduling 1-hour reminder in 45 minutes
⏰ [Reminder] Scheduling 30-minute reminder in 15 minutes
⚠️ [Reminder] 10-minute reminder skipped (too late)
✅ [Reminder] Scheduled 2 reminders for appointment app_123
🔔 [Reminder] Sending reminder for appointment app_123
✅ [Reminder] Notification sent successfully
```

## 🎉 Done!

Hệ thống đã hoàn chỉnh và sẵn sàng sử dụng!
