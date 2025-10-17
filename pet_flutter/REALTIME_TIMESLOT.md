# ⏰ Realtime Time Slot Selection Feature

## 📋 Tổng Quan

Tính năng **Realtime Time Slot Selection** cho phép người dùng thấy được khi có người khác đang chọn cùng khung giờ với cùng nhân viên, tránh xung đột khi đặt lịch. Tính năng này được implement giống hệt web version sử dụng **SignalR** cho realtime communication.

## 🎯 Nguyên Tắc Hoạt Động

### ✅ Điều Kiện Hiển Thị "Người Khác Đang Chọn"

Chỉ hiển thị indicator khi **CẢ 3 điều kiện** sau đều đúng:

1. ✅ **Cùng Service** (Dịch vụ)
2. ✅ **Cùng Staff** (Nhân viên)
3. ✅ **Cùng Date** (Ngày)

**VÍ DỤ:**
- User A chọn: Service 1, Staff 2, Date 2025-10-16, Time 19:40
- User B chọn: Service 1, Staff 2, Date 2025-10-16, Time 19:40
- ➡️ **CẢ HAI** thấy indicator "Người khác đang chọn" ở khung 19:40

- User A chọn: Service 1, **Staff 2**, Date 2025-10-16, Time 19:40
- User C chọn: Service 1, **Staff 3**, Date 2025-10-16, Time 19:40
- ➡️ **KHÔNG** thấy indicator vì khác nhân viên

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                       Flutter App                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         appointment_booking_page.dart                 │  │
│  │                                                        │  │
│  │  - DateTimeStep Widget                                │  │
│  │  - Time Slot Grid with Visual Indicators             │  │
│  │  - Purple border + Pulse animation                    │  │
│  │  - User badge indicator                               │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │          signalr_service.dart                         │  │
│  │                                                        │  │
│  │  - HubConnection management                           │  │
│  │  - Event handlers (TimeSlotSelected/Cleared)          │  │
│  │  - Room key generation                                │  │
│  │  - Broadcast selection/deselection                    │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ SignalR WebSocket
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                  Backend Server                               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            TimeSlotHub (SignalR Hub)                  │  │
│  │                                                        │  │
│  │  - JoinTimeSlotRoom(roomKey)                          │  │
│  │  - LeaveTimeSlotRoom(roomKey)                         │  │
│  │  - NotifyTimeSlotSelected(data)                       │  │
│  │  - NotifyTimeSlotCleared(data)                        │  │
│  │                                                        │  │
│  │  Events:                                              │  │
│  │  - TimeSlotSelected                                   │  │
│  │  - TimeSlotCleared                                    │  │
│  │  - UserJoinedTimeSlotRoom                            │  │
│  │  - UserLeftTimeSlotRoom                              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Details

### 1. SignalR Service (`lib/services/signalr_service.dart`)

**Chức năng chính:**
- Kết nối đến TimeSlotHub
- Quản lý room (join/leave)
- Broadcast events khi user chọn/bỏ chọn slot
- Listen events từ users khác

**Key Methods:**

```dart
// Initialize connection
Future<bool> initialize()

// Join room với format: service_1_staff_2_date_2025-10-16
Future<bool> joinTimeSlotRoom(String roomKey)

// Leave room
Future<bool> leaveTimeSlotRoom(String roomKey)

// Broadcast selection
Future<bool> notifyTimeSlotSelected({
  required String roomKey,
  required String timeSlot,
  required String serviceId,
  required String staffId,
  required String date,
})

// Broadcast deselection
Future<bool> notifyTimeSlotCleared({...})

// Generate room key
String generateRoomKey({
  required String serviceId,
  required String staffId,
  required String date,
})
```

**Event Streams:**

```dart
Stream<TimeSlotSelectionEvent> timeSlotSelectedStream
Stream<TimeSlotSelectionEvent> timeSlotClearedStream
Stream<bool> connectionStatusStream
```

### 2. DateTimeStep Widget (`lib/pages/appointment_steps.dart`)

**State Management:**

```dart
// Track other users' selections
Map<String, TimeSlotSelectionEvent> _otherUsersSelections = {};

// Current room key
String? _currentRoomKey;

// SignalR connection status
bool _signalRConnected = false;
```

**Lifecycle:**

```dart
@override
void initState() {
  super.initState();
  fetchStaff();
  _initializeSignalR();  // Kết nối SignalR
}

@override
void dispose() {
  _slotSelectedSubscription?.cancel();
  _slotClearedSubscription?.cancel();
  _connectionStatusSubscription?.cancel();
  _leaveCurrentRoom();  // Rời room khi dispose
  super.dispose();
}
```

**Event Listeners:**

```dart
void _setupSignalRListeners() {
  // Listen for selection events
  _slotSelectedSubscription = _signalRService.timeSlotSelectedStream.listen((event) {
    setState(() {
      _otherUsersSelections[event.timeSlot] = event;
    });
    
    // Auto-clear after 15 seconds (same as web)
    Timer(const Duration(seconds: 15), () {
      setState(() {
        _otherUsersSelections.remove(event.timeSlot);
      });
    });
  });

  // Listen for clear events
  _slotClearedSubscription = _signalRService.timeSlotClearedStream.listen((event) {
    setState(() {
      _otherUsersSelections.remove(event.timeSlot);
    });
  });
}
```

**Room Management:**

```dart
Future<void> _joinSignalRRoom() async {
  final roomKey = _signalRService.generateRoomKey(
    serviceId: widget.bookingData.selectedService!.serviceId.toString(),
    staffId: selectedStaff!.staffId.toString(),
    date: selectedDate!.toIso8601String().split('T')[0],
  );

  if (_currentRoomKey != roomKey) {
    await _leaveCurrentRoom();
    final success = await _signalRService.joinTimeSlotRoom(roomKey);
    if (success) {
      _currentRoomKey = roomKey;
    }
  }
}
```

### 3. Visual Indicators

**Time Slot Card với Priority Màu Sắc:**

```dart
// Priority hierarchy (cao đến thấp):
if (isPast) {
  // 1. Đã qua (Grey)
  borderColor = Colors.grey;
  backgroundColor = Colors.grey.shade50;
  statusText = 'Đã qua';
  statusIcon = '⏰';
} else if (isBeingSelectedByOthers) {
  // 2. Người khác đang chọn (Purple) 🆕
  borderColor = Colors.purple;
  backgroundColor = Colors.purple.shade50;
  statusText = '${otherUserSelection.userName} đang chọn';
  statusIcon = '👥';
} else if (slot.isPetBusy) {
  // 3. Thú cưng bận (Red)
  borderColor = Colors.red;
  backgroundColor = Colors.red.shade50;
  statusText = 'Thú cưng bận';
  statusIcon = '🐕';
} else if (slot.isStaffBusy) {
  // 4. Nhân viên bận (Orange)
  borderColor = Colors.orange;
  backgroundColor = Colors.orange.shade50;
  statusText = 'Nhân viên bận';
  statusIcon = '👤';
} else if (!slot.isAvailable) {
  // 5. Không khả dụng (Grey)
  borderColor = Colors.grey;
  backgroundColor = Colors.grey.shade50;
  statusText = 'Không khả dụng';
  statusIcon = '❌';
} else {
  // 6. Khả dụng (Green)
  borderColor = Colors.green;
  backgroundColor = Colors.green.shade50;
  statusText = 'Khả dụng';
  statusIcon = '✅';
  isEnabled = true;
}
```

**User Indicator Badge:**

```dart
if (isBeingSelectedByOthers)
  Positioned(
    top: -4,
    right: -4,
    child: Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.purple,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: const Icon(Icons.person, color: Colors.white, size: 12),
    ),
  ),
```

**Pulse Animation:**

```dart
class _PulsingBorder extends StatefulWidget {
  // Animates border opacity from 0.7 to 0.3 in 2 seconds loop
}

// Usage:
if (isBeingSelectedByOthers)
  Positioned.fill(
    child: _PulsingBorder(),
  ),
```

## 📊 Room Key Format

```
service_{serviceId}_staff_{staffId}_date_{YYYY-MM-DD}
```

**Ví dụ:**
- `service_1_staff_2_date_2025-10-16`
- `service_5_staff_10_date_2025-10-20`

## 🎨 Visual States Comparison

| State | Border | Background | Icon | Clickable | Priority |
|-------|--------|------------|------|-----------|----------|
| **Người khác đang chọn** | 🟣 Purple + Pulse | Light Purple | 👥 | ❌ No | 2 |
| Đã qua | ⚫ Grey | Light Grey | ⏰ | ❌ No | 1 |
| Thú cưng bận | 🔴 Red | Light Red | 🐕 | ❌ No | 3 |
| Nhân viên bận | 🟠 Orange | Light Orange | 👤 | ❌ No | 4 |
| Không khả dụng | ⚫ Grey | Light Grey | ❌ | ❌ No | 5 |
| Khả dụng | 🟢 Green | Light Green | ✅ | ✅ Yes | 6 |
| Đã chọn | 🔵 Primary | Primary Gradient | - | ✅ Yes | - |

## 🔄 User Flow

### Scenario: 2 Users chọn cùng lúc

**User A:**
1. Chọn Service: Spa
2. Chọn Staff: Nguyễn Văn A
3. Chọn Date: 2025-10-16
4. Join room: `service_1_staff_2_date_2025-10-16`
5. Chọn slot 19:40
6. ➡️ Broadcast `TimeSlotSelected` với timeSlot="19:40"

**User B (cùng lúc):**
1. Chọn Service: Spa
2. Chọn Staff: Nguyễn Văn A
3. Chọn Date: 2025-10-16
4. Join room: `service_1_staff_2_date_2025-10-16` (cùng room)
5. Nhận event `TimeSlotSelected` từ User A
6. ➡️ Slot 19:40 hiện indicator: "User A đang chọn" với purple border + pulse animation
7. ❌ **KHÔNG THỂ** chọn slot 19:40 (disabled)
8. User B chọn slot khác (19:50)

**Auto-clear:**
- Sau 15 giây, nếu User A không confirm booking, indicator tự động mất
- Hoặc khi User A deselect/chọn slot khác

## 🛠️ Backend Requirements

Backend cần implement **TimeSlotHub** với các methods:

```csharp
public class TimeSlotHub : Hub
{
    // Join room
    public async Task JoinTimeSlotRoom(string roomKey)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomKey);
        await Clients.Group(roomKey).SendAsync("UserJoinedTimeSlotRoom", new {
            userId = Context.UserIdentifier,
            userName = GetUserName(),
            roomKey = roomKey
        });
    }

    // Leave room
    public async Task LeaveTimeSlotRoom(string roomKey)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomKey);
        await Clients.Group(roomKey).SendAsync("UserLeftTimeSlotRoom", new {
            userId = Context.UserIdentifier,
            userName = GetUserName(),
            roomKey = roomKey
        });
    }

    // Notify slot selection
    public async Task NotifyTimeSlotSelected(object data)
    {
        var roomKey = data.roomKey;
        // Broadcast to all in room EXCEPT sender
        await Clients.OthersInGroup(roomKey).SendAsync("TimeSlotSelected", data);
    }

    // Notify slot cleared
    public async Task NotifyTimeSlotCleared(object data)
    {
        var roomKey = data.roomKey;
        await Clients.OthersInGroup(roomKey).SendAsync("TimeSlotCleared", data);
    }
}
```

## 🧪 Testing

### Test Case 1: Cùng Service, Cùng Staff, Cùng Date

**Steps:**
1. User A: Service=1, Staff=2, Date=2025-10-16, Select slot 19:40
2. User B: Service=1, Staff=2, Date=2025-10-16

**Expected:**
- User B thấy slot 19:40 có purple border + pulse + badge
- Slot 19:40 disabled cho User B

### Test Case 2: Cùng Service, Khác Staff

**Steps:**
1. User A: Service=1, Staff=2, Date=2025-10-16, Select slot 19:40
2. User C: Service=1, Staff=3, Date=2025-10-16

**Expected:**
- User C **KHÔNG** thấy indicator ở slot 19:40
- Slot 19:40 vẫn available cho User C (nếu staff 3 rảnh)

### Test Case 3: Auto-clear after 15s

**Steps:**
1. User A: Select slot 19:40
2. Wait 15 seconds
3. User B joins room

**Expected:**
- After 15s, indicator tự động mất
- User B không thấy indicator nữa

### Test Case 4: Deselect

**Steps:**
1. User A: Select slot 19:40
2. User A: Click slot 19:50 (change selection)

**Expected:**
- Broadcast `TimeSlotCleared` cho 19:40
- Broadcast `TimeSlotSelected` cho 19:50
- User B thấy indicator chuyển từ 19:40 sang 19:50

## 📱 UI Screenshots Mockup

```
┌─────────────────────────────────────────────────────────┐
│  🟢 19:00    🟢 19:20    🟣 19:40 [👤]                  │
│  ✅ Available ✅ Available 👥 Hùng đang chọn            │
│                           (Pulsing border)              │
│                                                         │
│  🔴 20:00    🟠 20:20    🔵 20:40                      │
│  🐕 Pet busy 👤 Staff    (Selected - User's choice)     │
│                busy                                     │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Key Benefits

✅ **Tránh xung đột:** Users không thể book cùng slot
✅ **Realtime:** Thấy ngay khi có người chọn
✅ **Giống Web:** Consistent UX giữa web và mobile
✅ **Auto-clear:** Tự động giải phóng sau 15s
✅ **Visual feedback:** Purple border + pulse animation + badge rõ ràng
✅ **Room isolation:** Chỉ hiển thị cho đúng service/staff/date

## 🔗 Related Files

- `lib/services/signalr_service.dart` - SignalR connection management
- `lib/services/timeslot_signalr_service.dart` - New service (optional alternative)
- `lib/providers/timeslot_reservation_provider.dart` - Provider pattern (optional)
- `lib/pages/appointment_steps.dart` - UI implementation
- `pet_web/src/services/signalrService.js` - Web version reference
- `pet_web/src/components/appointment/TimeSlotGrid.js` - Web UI reference

## 📝 Notes

- SignalR connection sử dụng WebSockets
- Fallback tới Long Polling nếu WebSocket không available
- Auto-reconnect với intervals: [0, 2000, 10000, 30000]ms
- Room key phải match EXACT giữa Flutter và Backend
- Event filtering: Ignore own events dựa trên userId

---

**Created:** 2025-10-16  
**Version:** 1.0  
**Author:** GitHub Copilot  
**Status:** ✅ Implementation Complete
