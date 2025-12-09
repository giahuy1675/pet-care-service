import 'dart:async';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:pet_flutter/models/reminder_status.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:permission_handler/permission_handler.dart';

class AppointmentReminderService {
  static final AppointmentReminderService _instance = AppointmentReminderService._internal();
  factory AppointmentReminderService() => _instance;
  AppointmentReminderService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  final Map<String, ReminderStatusModel> _reminderStatuses = {};
  
  // Stream controller để broadcast status changes
  final _statusController = StreamController<ReminderStatusModel>.broadcast();
  Stream<ReminderStatusModel> get statusStream => _statusController.stream;
  
  bool _initialized = false;

  /// Initialize local notifications
  Future<void> initialize() async {
    if (_initialized) return;

    // Yêu cầu quyền exact alarm cho Android 12+
    final alarmStatus = await Permission.scheduleExactAlarm.status;
    print('📱 Schedule exact alarm status: $alarmStatus');
    
    if (!alarmStatus.isGranted) {
      print('⚠️ Requesting exact alarm permission...');
      final result = await Permission.scheduleExactAlarm.request();
      print('📋 Permission result: $result');
      
      if (!result.isGranted) {
        print('❌ Exact alarm permission denied - opening settings');
        await openAppSettings();
      }
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap
      },
    );

    _initialized = true;
  }

  /// Lấy status hiện tại của appointment
  ReminderStatusModel? getStatus(String appointmentId) {
    return _reminderStatuses[appointmentId];
  }

  /// Update reminder status
  void _updateReminderStatus(String appointmentId, int minutesUntil, {bool skipped = false}) {
    final status = _reminderStatuses[appointmentId];
    if (status == null) return;

    ReminderStatusModel updatedStatus;
    final now = DateTime.now();

    if (minutesUntil == 60) {
      updatedStatus = status.copyWith(
        oneHourStatus: skipped ? ReminderStatus.skipped : ReminderStatus.sent,
        oneHourSentAt: skipped ? null : now,
      );
    } else if (minutesUntil == 30) {
      updatedStatus = status.copyWith(
        thirtyMinuteStatus: skipped ? ReminderStatus.skipped : ReminderStatus.sent,
        thirtyMinuteSentAt: skipped ? null : now,
      );
    } else if (minutesUntil == 10) {
      updatedStatus = status.copyWith(
        tenMinuteStatus: skipped ? ReminderStatus.skipped : ReminderStatus.sent,
        tenMinuteSentAt: skipped ? null : now,
      );
    } else {
      // on-time (0 minute)
      updatedStatus = status.copyWith(
        onTimeStatus: skipped ? ReminderStatus.skipped : ReminderStatus.sent,
        onTimeSentAt: skipped ? null : now,
      );
    }

    _reminderStatuses[appointmentId] = updatedStatus;
    _statusController.add(updatedStatus);
  }

  /// Thiết lập nhắc nhở cho một lịch hẹn
  Future<void> scheduleReminders({
    required String appointmentId,
    required DateTime appointmentTime,
    required String petName,
    required String serviceName,
    String? userId,
  }) async {
    await initialize();
    
    // Hủy các reminder cũ nếu có
    await cancelReminders(appointmentId);

    final now = DateTime.now();

    // Tạo status model ban đầu
    final statusModel = ReminderStatusModel(
      appointmentId: appointmentId,
      appointmentTime: appointmentTime,
    );
    _reminderStatuses[appointmentId] = statusModel;
    _statusController.add(statusModel);
    
    // Base notification ID (dùng appointmentId hashCode để unique)
    final baseId = appointmentId.hashCode.abs();

    // Notification details
    const androidDetails = AndroidNotificationDetails(
      'appointment_reminders',
      'Lịch hẹn nhắc nhở',
      channelDescription: 'Thông báo nhắc nhở lịch hẹn',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    int scheduledCount = 0;

    // Reminder 1: 1 tiếng trước
    final oneHourBefore = appointmentTime.subtract(const Duration(hours: 1));
    if (oneHourBefore.isAfter(now)) {
      await _notificationsPlugin.zonedSchedule(
        baseId + 1,
        '⏰ Nhắc lịch hẹn - Còn 1 tiếng!',
        'Lịch hẹn "$serviceName" cho $petName sẽ bắt đầu trong 1 tiếng. Hãy chuẩn bị nhé!',
        tz.TZDateTime.from(oneHourBefore, tz.local),
        notificationDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: 'appointment:$appointmentId:60',
      );
      scheduledCount++;
    } else {
      _updateReminderStatus(appointmentId, 60, skipped: true);
    }

    // Reminder 2: 30 phút trước
    final thirtyMinutesBefore = appointmentTime.subtract(const Duration(minutes: 30));
    if (thirtyMinutesBefore.isAfter(now)) {
      await _notificationsPlugin.zonedSchedule(
        baseId + 2,
        '⏳ Nhắc lịch hẹn - Còn 30 phút!',
        'Lịch hẹn "$serviceName" cho $petName sẽ bắt đầu trong 30 phút. Đừng quên nhé!',
        tz.TZDateTime.from(thirtyMinutesBefore, tz.local),
        notificationDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: 'appointment:$appointmentId:30',
      );
      scheduledCount++;
    } else {
      _updateReminderStatus(appointmentId, 30, skipped: true);
    }

    // Reminder 3: 10 phút trước
    final tenMinutesBefore = appointmentTime.subtract(const Duration(minutes: 10));
    if (tenMinutesBefore.isAfter(now)) {
      await _notificationsPlugin.zonedSchedule(
        baseId + 3,
        '🚨 Nhắc lịch hẹn - Còn 10 phút!',
        'Lịch hẹn "$serviceName" cho $petName sắp bắt đầu! Hãy đến đúng giờ nhé!',
        tz.TZDateTime.from(tenMinutesBefore, tz.local),
        notificationDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: 'appointment:$appointmentId:10',
      );
      scheduledCount++;
    } else {
      _updateReminderStatus(appointmentId, 10, skipped: true);
    }

    // Reminder 4: On-time (at appointment start)
    if (appointmentTime.isAfter(now)) {
      await _notificationsPlugin.zonedSchedule(
        baseId + 4,
        '🔔 Lịch hẹn bắt đầu ngay bây giờ!',
        'Lịch hẹn "$serviceName" cho $petName đang bắt đầu. Vui lòng tới đúng giờ.',
        tz.TZDateTime.from(appointmentTime, tz.local),
        notificationDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: 'appointment:$appointmentId:0',
      );
      scheduledCount++;
    } else {
      _updateReminderStatus(appointmentId, 0, skipped: true);
    }

    print('✅ Scheduled $scheduledCount reminders for appointment $appointmentId');
    
    // Log thông tin chi tiết
    print('📅 Appointment time: $appointmentTime');
    print('🕐 Current time: $now');
    if (scheduledCount > 0) {
      await checkPendingNotifications();
    }
  }

  Future<void> cancelReminders(String appointmentId) async {
    final baseId = appointmentId.hashCode.abs();
    
    // Cancel all 4 notifications for this appointment
    await _notificationsPlugin.cancel(baseId + 1); // 1 hour
    await _notificationsPlugin.cancel(baseId + 2); // 30 min
    await _notificationsPlugin.cancel(baseId + 3); // 10 min
    await _notificationsPlugin.cancel(baseId + 4); // on-time
    
    _reminderStatuses.remove(appointmentId);
    print('🗑️ Cancelled reminders for appointment $appointmentId');
  }

  Future<void> cancelAllReminders() async {
    await _notificationsPlugin.cancelAll();
    _reminderStatuses.clear();
    print('🗑️ Cancelled all reminders');
  }

  int get activeReminderCount => _reminderStatuses.length;

  bool hasActiveReminders(String appointmentId) {
    return _reminderStatuses.containsKey(appointmentId);
  }
  
  /// Kiểm tra pending notifications
  Future<void> checkPendingNotifications() async {
    final List<PendingNotificationRequest> pendingNotifications = 
        await _notificationsPlugin.pendingNotificationRequests();
    
    print('📋 Total pending notifications: ${pendingNotifications.length}');
    for (final notification in pendingNotifications) {
      print('  - ID: ${notification.id}, Title: ${notification.title}, Body: ${notification.body}');
      if (notification.payload != null) {
        print('    Payload: ${notification.payload}');
      }
    }
  }
  
  void dispose() {
    _statusController.close();
  }
}
