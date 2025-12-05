import 'dart:async';
import 'package:signalr_core/signalr_core.dart';
import 'package:flutter/foundation.dart';

/// Service để quản lý SignalR connection cho TimeSlot realtime
/// Tương tự signalrService.js trong web project
class TimeSlotSignalRService {
  static final TimeSlotSignalRService _instance = TimeSlotSignalRService._internal();
  factory TimeSlotSignalRService() => _instance;
  TimeSlotSignalRService._internal();

  HubConnection? _connection;
  String? _currentRoomKey;
  bool _isConnected = false;
  
  // Event controllers cho các events từ SignalR
  final _timeSlotSelectedController = StreamController<TimeSlotSelection>.broadcast();
  final _timeSlotClearedController = StreamController<TimeSlotSelection>.broadcast();
  final _connectionStatusController = StreamController<bool>.broadcast();
  
  // Streams public để listen
  Stream<TimeSlotSelection> get onTimeSlotSelected => _timeSlotSelectedController.stream;
  Stream<TimeSlotSelection> get onTimeSlotCleared => _timeSlotClearedController.stream;
  Stream<bool> get onConnectionStatusChanged => _connectionStatusController.stream;
  
  bool get isConnected => _isConnected;
  String? get currentRoomKey => _currentRoomKey;

  /// Initialize SignalR connection
  Future<void> initialize() async {
    if (_connection != null && _connection!.state == HubConnectionState.connected) {

      return;
    }

    try {

      // Tạo connection đến TimeSlotHub (giống web)
      _connection = HubConnectionBuilder()
        .withUrl(
          'https://localhost:7164/timeSlotHub',
          HttpConnectionOptions(
          ),
        )
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Setup event handlers
      _setupEventHandlers();

      // Start connection
      await _connection!.start();
      _isConnected = true;
      _connectionStatusController.add(true);

    } catch (e) {

      _isConnected = false;
      _connectionStatusController.add(false);
      rethrow;
    }
  }

  /// Setup event handlers cho SignalR
  void _setupEventHandlers() {
    if (_connection == null) return;

    // Connection lifecycle events
    _connection!.onreconnecting((error) {

      _isConnected = false;
      _connectionStatusController.add(false);
    });

    _connection!.onreconnected((connectionId) {

      _isConnected = true;
      _connectionStatusController.add(true);
      
      // Rejoin room if exists
      if (_currentRoomKey != null) {
        _joinRoom(_currentRoomKey!);
      }
    });

    _connection!.onclose((error) {

      _isConnected = false;
      _connectionStatusController.add(false);
    });

    // TimeSlot selection events (NEW - giống web)
    _connection!.on('TimeSlotSelected', (arguments) {
      if (arguments == null || arguments.isEmpty) return;
      
      final data = arguments[0] as Map<String, dynamic>?;
      if (data == null) return;

      final selection = TimeSlotSelection(
        timeSlot: data['timeSlot'] as String,
        userId: data['userId'] as String,
        userName: data['userName'] as String?,
        serviceId: data['serviceId'] as int?,
        staffId: data['staffId'] as int?,
        date: data['date'] as String?,
      );
      
      _timeSlotSelectedController.add(selection);
    });

    _connection!.on('TimeSlotCleared', (arguments) {
      if (arguments == null || arguments.isEmpty) return;
      
      final data = arguments[0] as Map<String, dynamic>?;
      if (data == null) return;

      final selection = TimeSlotSelection(
        timeSlot: data['timeSlot'] as String,
        userId: data['userId'] as String,
        userName: data['userName'] as String?,
        serviceId: data['serviceId'] as int?,
        staffId: data['staffId'] as int?,
        date: data['date'] as String?,
      );
      
      _timeSlotClearedController.add(selection);
    });

    _connection!.on('UserJoinedTimeSlotRoom', (arguments) {
      if (arguments == null || arguments.isEmpty) return;
      final data = arguments[0] as Map<String, dynamic>?;

    });

    _connection!.on('UserLeftTimeSlotRoom', (arguments) {
      if (arguments == null || arguments.isEmpty) return;
      final data = arguments[0] as Map<String, dynamic>?;

    });
  }

  /// Join room cho specific service/staff/date
  Future<bool> joinTimeSlotRoom({
    required int serviceId,
    required int staffId,
    required String date,
  }) async {
    if (_connection == null || _connection!.state != HubConnectionState.connected) {

      return false;
    }

    // Leave current room first
    if (_currentRoomKey != null) {
      await leaveCurrentRoom();
    }

    // Create room key: service_1_staff_2_date_2025-10-16
    final roomKey = 'service_${serviceId}_staff_${staffId}_date_$date';
    
    return await _joinRoom(roomKey);
  }

  Future<bool> _joinRoom(String roomKey) async {
    try {

      await _connection!.invoke('JoinTimeSlotRoom', args: [roomKey]);
      _currentRoomKey = roomKey;

      return true;
    } catch (e) {

      return false;
    }
  }

  /// Leave current room
  Future<void> leaveCurrentRoom() async {
    if (_currentRoomKey == null) return;
    if (_connection == null || _connection!.state != HubConnectionState.connected) {
      _currentRoomKey = null;
      return;
    }

    try {

      await _connection!.invoke('LeaveTimeSlotRoom', args: [_currentRoomKey]);

    } catch (e) {

    } finally {
      _currentRoomKey = null;
    }
  }

  /// Broadcast khi user chọn time slot
  Future<void> selectTimeSlot({
    required String timeSlot,
    required String userId,
    String? userName,
    int? serviceId,
    int? staffId,
    String? date,
  }) async {
    if (_connection == null || _connection!.state != HubConnectionState.connected) {

      return;
    }

    if (_currentRoomKey == null) {

      return;
    }

    try {

      await _connection!.invoke('SelectTimeSlot', args: [
        _currentRoomKey,
        {
          'timeSlot': timeSlot,
          'userId': userId,
          'userName': userName ?? 'Unknown',
          'serviceId': serviceId,
          'staffId': staffId,
          'date': date,
        }
      ]);

    } catch (e) {

    }
  }

  /// Broadcast khi user clear/deselect time slot
  Future<void> clearTimeSlot({
    required String timeSlot,
    required String userId,
    String? userName,
    int? serviceId,
    int? staffId,
    String? date,
  }) async {
    if (_connection == null || _connection!.state != HubConnectionState.connected) {

      return;
    }

    if (_currentRoomKey == null) {

      return;
    }

    try {

      await _connection!.invoke('ClearTimeSlot', args: [
        _currentRoomKey,
        {
          'timeSlot': timeSlot,
          'userId': userId,
          'userName': userName ?? 'Unknown',
          'serviceId': serviceId,
          'staffId': staffId,
          'date': date,
        }
      ]);

    } catch (e) {

    }
  }

  /// Disconnect SignalR
  Future<void> disconnect() async {
    if (_connection == null) return;

    try {
      await leaveCurrentRoom();
      await _connection!.stop();
      _isConnected = false;
      _connectionStatusController.add(false);

    } catch (e) {

    }
  }

  /// Dispose all resources
  void dispose() {
    _timeSlotSelectedController.close();
    _timeSlotClearedController.close();
    _connectionStatusController.close();
    disconnect();
  }
}

/// Model cho TimeSlot selection event
class TimeSlotSelection {
  final String timeSlot;
  final String userId;
  final String? userName;
  final int? serviceId;
  final int? staffId;
  final String? date;
  final DateTime timestamp;

  TimeSlotSelection({
    required this.timeSlot,
    required this.userId,
    this.userName,
    this.serviceId,
    this.staffId,
    this.date,
  }) : timestamp = DateTime.now();

  @override
  String toString() {
    return 'TimeSlotSelection(timeSlot: $timeSlot, userId: $userId, userName: $userName)';
  }
}
