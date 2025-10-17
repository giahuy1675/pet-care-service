# 🔍 Debug Guide - Realtime Time Slot Selection

## 📱 Cách Test Realtime Feature

### ✅ Bước 1: Kiểm Tra Console Logs

Khi chạy app, check console logs để xem:

```
✅ SignalR Connected successfully
✅ Joined SignalR room: service_1_staff_2_date_2025-10-16
```

Nếu KHÔNG thấy logs trên:
- ❌ Backend chưa chạy hoặc URL sai
- ❌ User chưa login (không có token/userId)

### ✅ Bước 2: Test với 2 Devices/Emulators

**Device A (User Hùng):**
1. Login vào app
2. Đặt lịch hẹn → Chọn dịch vụ
3. Chọn thú cưng
4. Chọn nhân viên: **Nguyễn Văn A**
5. Chọn ngày: **16/10/2025**
6. Check console logs:
   ```
   ✅ Joined SignalR room: service_X_staff_Y_date_2025-10-16
   ```
7. Click slot **17:20 - 17:50**
8. Check console logs:
   ```
   📤 [DEBUG] Broadcasting slot selection: 17:20 in room service_X_staff_Y_date_2025-10-16
   ✅ [DEBUG] Broadcast complete for 17:20
   ```

**Device B (User Mai):**
1. Login vào app (user khác)
2. Đặt lịch hẹn → Chọn **CÙNG** dịch vụ
3. Chọn thú cưng
4. Chọn **CÙNG** nhân viên: **Nguyễn Văn A**
5. Chọn **CÙNG** ngày: **16/10/2025**
6. ➡️ **Device B sẽ thấy slot 17:20:**
   - 🟣 **Purple border** (màu tím)
   - 👤 **Badge** ở góc trên phải
   - 👥 **Text:** "Hùng đang chọn"
   - ⚡ **Pulse animation** (nhấp nháy)
   - ❌ **Disabled** (không click được)
7. Check console logs:
   ```
   🔔 [DEBUG] Received TimeSlotSelected: 17:20 by Hùng
   🔔 [DEBUG] Current room: service_X_staff_Y_date_2025-10-16
   🔔 [DEBUG] Event room: service_X_staff_Y_date_2025-10-16
   🔔 [DEBUG] Total selections: 1
   ```

### ❌ Test Case: KHÁC Nhân Viên

**Device A:** Chọn Staff **Nguyễn Văn A**, slot 17:20  
**Device B:** Chọn Staff **Trần Văn B**, ngày 16/10

**Expected:**
- ✅ Device B **KHÔNG** thấy indicator ở slot 17:20
- ✅ Console logs khác room:
  ```
  Device A room: service_1_staff_2_date_2025-10-16
  Device B room: service_1_staff_3_date_2025-10-16
  ```

## 🔧 Troubleshooting

### Vấn Đề 1: "Real-time: Tắt"

**Nguyên nhân:**
- Backend chưa chạy
- URL sai trong `lib/config/api_config.dart`
- User chưa login (không có token)

**Giải pháp:**
1. Check backend đang chạy:
   ```bash
   https://localhost:7164/timeSlotHub
   ```
2. Check api_config.dart:
   ```dart
   static const String baseUrl = 'https://localhost:7164';
   ```
3. Check user đã login chưa

### Vấn Đề 2: "Real-time: Hoạt động" nhưng không thấy indicator

**Nguyên nhân:**
- Room key khác nhau (khác service/staff/date)
- Backend không broadcast event đúng

**Debug:**
1. Check console logs để so sánh room key:
   ```
   Device A: service_1_staff_2_date_2025-10-16
   Device B: service_1_staff_2_date_2025-10-16
   ```
   ➡️ Phải **GIỐNG NHAU 100%**

2. Check console logs khi click slot:
   ```
   Device A:
   📤 [DEBUG] Broadcasting slot selection: 17:20 in room service_1_staff_2_date_2025-10-16
   ✅ [DEBUG] Broadcast complete for 17:20

   Device B:
   🔔 [DEBUG] Received TimeSlotSelected: 17:20 by Hùng
   ```

### Vấn Đề 3: Backend chưa implement TimeSlotHub

**Backend cần có:**

```csharp
// Hubs/TimeSlotHub.cs
using Microsoft.AspNetCore.SignalR;

namespace BE_PetWeb_API.Hubs
{
    public class TimeSlotHub : Hub
    {
        public async Task JoinTimeSlotRoom(string roomKey)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomKey);
            Console.WriteLine($"✅ User {Context.UserIdentifier} joined room: {roomKey}");
            
            await Clients.Group(roomKey).SendAsync("UserJoinedTimeSlotRoom", new
            {
                userId = Context.UserIdentifier,
                userName = Context.User?.Identity?.Name ?? "Unknown",
                roomKey = roomKey
            });
        }

        public async Task LeaveTimeSlotRoom(string roomKey)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomKey);
            Console.WriteLine($"✅ User {Context.UserIdentifier} left room: {roomKey}");
            
            await Clients.Group(roomKey).SendAsync("UserLeftTimeSlotRoom", new
            {
                userId = Context.UserIdentifier,
                userName = Context.User?.Identity?.Name ?? "Unknown",
                roomKey = roomKey
            });
        }

        public async Task NotifyTimeSlotSelected(Dictionary<string, object> data)
        {
            var roomKey = data["roomKey"].ToString();
            Console.WriteLine($"📤 Broadcasting TimeSlotSelected to room: {roomKey}");
            
            // Broadcast to all in group EXCEPT sender
            await Clients.OthersInGroup(roomKey).SendAsync("TimeSlotSelected", data);
        }

        public async Task NotifyTimeSlotCleared(Dictionary<string, object> data)
        {
            var roomKey = data["roomKey"].ToString();
            Console.WriteLine($"📤 Broadcasting TimeSlotCleared to room: {roomKey}");
            
            // Broadcast to all in group EXCEPT sender
            await Clients.OthersInGroup(roomKey).SendAsync("TimeSlotCleared", data);
        }
    }
}
```

**Program.cs cần map hub:**

```csharp
app.MapHub<TimeSlotHub>("/timeSlotHub");
```

## 📊 Expected UI States

### State 1: Normal (Available)
```
┌──────────────┐
│ ✅ 17:20     │
│ Khả dụng     │
└──────────────┘
```

### State 2: Being Selected by Others
```
┌──────────────┐ [👤] ← Badge
│ 👥 17:20     │ ← Purple border + pulse
│ Hùng đang... │ ← Purple text
└──────────────┘
❌ Disabled
```

### State 3: After 15 seconds
```
Auto-clear → Back to State 1 (Available)
```

## 🎯 Quick Checklist

- [ ] Backend running at `https://localhost:7164`
- [ ] TimeSlotHub implemented with 4 methods
- [ ] User đã login (có token)
- [ ] SignalR status shows "Real-time: Hoạt động"
- [ ] Room key hiển thị ở UI (e.g., "Room: service_1_staff_2_date_2025-10-16")
- [ ] Test với 2 devices cùng service/staff/date
- [ ] Console logs shows broadcast/receive events
- [ ] UI hiện purple border + badge khi người khác chọn

## 🔍 Debug Commands

**Check console trong VS Code:**
1. Chạy app: `flutter run`
2. Khi app chạy, nhấn trong terminal
3. Tất cả logs sẽ hiện ở terminal
4. Look for:
   - `✅ SignalR Connected`
   - `✅ Joined SignalR room`
   - `📤 Broadcasting slot selection`
   - `🔔 Received TimeSlotSelected`

**Filter logs:**
```bash
# Windows PowerShell
flutter run | Select-String "SignalR|DEBUG"
```

## 📱 Visual Demo

**Screen with realtime indicator:**
```
Real-time: Hoạt động ✓
Room: service_1_staff_2_date_2025-10-16
1 người khác đang chọn

Time Slots:
┌─────────┐  ┌─────────┐  ┌─────────┐ [👤]
│✅ 17:00 │  │🟣 17:20 │  │✅ 17:40 │
│Available│  │Hùng...  │  │Available│
└─────────┘  └─────────┘  └─────────┘
             (Pulsing)
```

---

**Next Steps:**
1. Run `flutter run` on 2 devices
2. Check console logs
3. Test same service/staff/date
4. Confirm purple indicator appears
5. Wait 15s to see auto-clear

**Need Help?**
- Check REALTIME_TIMESLOT.md for full documentation
- Check backend TimeSlotHub implementation
- Verify SignalR connection in console logs
