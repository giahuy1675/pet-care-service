import 'dart:async';
import 'package:signalr_core/signalr_core.dart';
import '../config/api_config.dart';
import 'secure_storage.dart';

class SignalRService {
  static final SignalRService _instance = SignalRService._internal();
  factory SignalRService() => _instance;
  SignalRService._internal();

  HubConnection? _connection;
  bool _isConnected = false;
  String? _currentRoomKey;
  String? _currentUserId;
  String? _currentUserName;
  
  // Stream controllers for real-time events
  final StreamController<TimeSlotSelectionEvent> _timeSlotSelectedController = 
      StreamController<TimeSlotSelectionEvent>.broadcast();
  final StreamController<TimeSlotSelectionEvent> _timeSlotClearedController = 
      StreamController<TimeSlotSelectionEvent>.broadcast();
  final StreamController<bool> _connectionStatusController = 
      StreamController<bool>.broadcast();

  // Getters for streams
  Stream<TimeSlotSelectionEvent> get timeSlotSelectedStream => _timeSlotSelectedController.stream;
  Stream<TimeSlotSelectionEvent> get timeSlotClearedStream => _timeSlotClearedController.stream;
  Stream<bool> get connectionStatusStream => _connectionStatusController.stream;

  bool get isConnected => _isConnected;
  String? get currentRoomKey => _currentRoomKey;

  // Initialize SignalR connection
  Future<bool> initialize() async {
    if (_connection != null && _isConnected) {

      return true;
    }

    try {

      // Get user info for authentication
      final storage = SecureStorageService();
      final token = await storage.readToken();
      final userId = await storage.readUserId();
      final userName = await storage.readUserName();
      
      _currentUserId = userId;
      _currentUserName = userName ?? 'Anonymous User';

      // Create connection
      _connection = HubConnectionBuilder()
          .withUrl(
            '${ApiConfig.baseUrl}/timeSlotHub',
            HttpConnectionOptions(
              accessTokenFactory: () async => token,
              transport: HttpTransportType.webSockets,
              skipNegotiation: false,
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

      return true;
    } catch (e) {

      _isConnected = false;
      _connectionStatusController.add(false);
      return false;
    }
  }

  // Setup event handlers
  void _setupEventHandlers() {
    if (_connection == null) return;

    // Connection state events
    _connection!.onreconnecting((error) {

      _isConnected = false;
      _connectionStatusController.add(false);
    });

    _connection!.onreconnected((connectionId) {

      _isConnected = true;
      _connectionStatusController.add(true);
      
      // Rejoin current room if any
      if (_currentRoomKey != null) {
        joinTimeSlotRoom(_currentRoomKey!);
      }
    });

    _connection!.onclose((error) {

      _isConnected = false;
      _connectionStatusController.add(false);
    });

    // Time slot selection events
    _connection!.on('TimeSlotSelected', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        try {
          final data = arguments[0] as Map<String, dynamic>;

          final event = TimeSlotSelectionEvent.fromJson(data);
          
          // Only process events from other users
          if (event.userId != _currentUserId) {

            _timeSlotSelectedController.add(event);
          } else {

          }
        } catch (e) {

        }
      }
    });

    _connection!.on('TimeSlotCleared', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        try {
          final data = arguments[0] as Map<String, dynamic>;

          final event = TimeSlotSelectionEvent.fromJson(data);
          
          // Only process events from other users
          if (event.userId != _currentUserId) {

            _timeSlotClearedController.add(event);
          } else {

          }
        } catch (e) {

        }
      }
    });

    _connection!.on('UserJoinedTimeSlotRoom', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        final data = arguments[0] as Map<String, dynamic>;

      }
    });

    _connection!.on('UserLeftTimeSlotRoom', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        final data = arguments[0] as Map<String, dynamic>;

      }
    });
  }

  // Join time slot room for real-time updates
  Future<bool> joinTimeSlotRoom(String roomKey) async {
    if (!_isConnected || _connection == null) {

      return false;
    }

    try {
      // Leave current room first
      if (_currentRoomKey != null && _currentRoomKey != roomKey) {
        await leaveTimeSlotRoom(_currentRoomKey!);
      }

      await _connection!.invoke('JoinTimeSlotRoom', args: [roomKey]);
      _currentRoomKey = roomKey;

      return true;
    } catch (e) {

      return false;
    }
  }

  // Leave time slot room
  Future<bool> leaveTimeSlotRoom(String roomKey) async {
    if (!_isConnected || _connection == null) {
      return false;
    }

    try {
      await _connection!.invoke('LeaveTimeSlotRoom', args: [roomKey]);
      if (_currentRoomKey == roomKey) {
        _currentRoomKey = null;
      }

      return true;
    } catch (e) {

      return false;
    }
  }

  // Notify when user selects a time slot
  Future<bool> notifyTimeSlotSelected({
    required String roomKey,
    required String timeSlot,
    required String serviceId,
    required String staffId,
    required String date,
  }) async {
    if (!_isConnected || _connection == null) {

      return false;
    }

    try {
      // Parse serviceId and staffId to int for backend
      final serviceIdInt = int.tryParse(serviceId);
      final staffIdInt = int.tryParse(staffId);

      // Format data exactly as backend expects - PascalCase to match C# properties
      final data = {
        'RoomKey': roomKey,  // Capital R to match TimeSlotSelectionRequest
        'TimeSlot': timeSlot,  // Capital T to match TimeSlotSelectionRequest
        'UserId': _currentUserId ?? 'anonymous',  // Capital U
        'UserName': _currentUserName ?? 'Anonymous User',  // Capital U
        'ServiceId': serviceIdInt,  // int? type - parsed from string
        'StaffId': staffIdInt,  // int? type - parsed from string
        'Date': date,  // Capital D
      };

      // Send as single argument (the data object)
      await _connection!.invoke('NotifyTimeSlotSelected', args: [data]);

      return true;
    } catch (e) {

      return false;
    }
  }

  // Notify when user clears/deselects a time slot
  Future<bool> notifyTimeSlotCleared({
    required String roomKey,
    required String timeSlot,
    required String serviceId,
    required String staffId,
    required String date,
  }) async {
    if (!_isConnected || _connection == null) {

      return false;
    }

    try {
      // Parse serviceId and staffId to int for backend
      final serviceIdInt = int.tryParse(serviceId);
      final staffIdInt = int.tryParse(staffId);

      // Format data exactly as backend expects - PascalCase to match C# properties
      final data = {
        'RoomKey': roomKey,  // Capital R to match TimeSlotSelectionRequest
        'TimeSlot': timeSlot,  // Capital T to match TimeSlotSelectionRequest
        'UserId': _currentUserId ?? 'anonymous',  // Capital U
        'UserName': _currentUserName ?? 'Anonymous User',  // Capital U
        'ServiceId': serviceIdInt,  // int? type - parsed from string
        'StaffId': staffIdInt,  // int? type - parsed from string
        'Date': date,  // Capital D
      };

      // Send as single argument (the data object)
      await _connection!.invoke('NotifyTimeSlotCleared', args: [data]);

      return true;
    } catch (e) {

      return false;
    }
  }

  // Generate room key (same format as web)
  String generateRoomKey({
    required String serviceId,
    required String staffId,
    required String date,
  }) {
    return 'service_${serviceId}_staff_${staffId}_date_$date';
  }

  // Disconnect
  Future<void> disconnect() async {
    try {
      if (_currentRoomKey != null) {
        await leaveTimeSlotRoom(_currentRoomKey!);
      }
      
      await _connection?.stop();
      _connection = null;
      _isConnected = false;
      _currentRoomKey = null;
      _connectionStatusController.add(false);

    } catch (e) {

    }
  }

  // Dispose resources
  void dispose() {
    _timeSlotSelectedController.close();
    _timeSlotClearedController.close();
    _connectionStatusController.close();
    disconnect();
  }
}

// Event model for time slot selection
class TimeSlotSelectionEvent {
  final String roomKey;
  final String timeSlot;
  final String userId;
  final String userName;
  final String serviceId;
  final String staffId;
  final String date;
  final DateTime timestamp;

  TimeSlotSelectionEvent({
    required this.roomKey,
    required this.timeSlot,
    required this.userId,
    required this.userName,
    required this.serviceId,
    required this.staffId,
    required this.date,
    required this.timestamp,
  });

  factory TimeSlotSelectionEvent.fromJson(Map<String, dynamic> json) {
    return TimeSlotSelectionEvent(
      // Backend sends PascalCase (TimeSlot, UserId, etc.)
      roomKey: json['RoomKey']?.toString() ?? json['roomKey']?.toString() ?? '',
      timeSlot: json['TimeSlot']?.toString() ?? json['timeSlot']?.toString() ?? '',
      userId: json['UserId']?.toString() ?? json['userId']?.toString() ?? '',
      userName: json['UserName']?.toString() ?? json['userName']?.toString() ?? 'Unknown User',
      // Backend sends int for serviceId and staffId, convert to string
      serviceId: json['ServiceId']?.toString() ?? json['serviceId']?.toString() ?? '',
      staffId: json['StaffId']?.toString() ?? json['staffId']?.toString() ?? '',
      date: json['Date']?.toString() ?? json['date']?.toString() ?? '',
      timestamp: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'roomKey': roomKey,
      'timeSlot': timeSlot,
      'userId': userId,
      'userName': userName,
      'serviceId': serviceId,
      'staffId': staffId,
      'date': date,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'TimeSlotSelectionEvent(timeSlot: $timeSlot, userName: $userName)';
  }
}
