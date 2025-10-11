import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/appointment.dart';
import '../models/time_slot.dart';
import '../network/http_client.dart';
import '../services/secure_storage.dart';
import 'service_service.dart';

class AppointmentService {
  // Lấy danh sách nhân viên theo dịch vụ
  Future<List<Staff>> getStaffByService(int serviceId) async {
    try {
      final url = '$_baseUrl/api/Staff/Service/$serviceId';
      final headers = await getAuthHeaders();
      final response = await _client.get(Uri.parse(url), headers: headers);
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map<String, dynamic>) {
          // Thử lấy field là mảng nhân viên
          data = decoded.values.firstWhere((v) => v is List, orElse: () => []);
        } else {
          throw Exception('Unknown response format for staff list');
        }
        return data.map((json) => Staff.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load staff: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching staff by service: $e');
      return [];
    }
  }
  final http.Client _client;
  final String _baseUrl;

  AppointmentService({http.Client? client, String? baseUrl})
      : _client = client ?? HttpClientFactory.create(),
        _baseUrl = baseUrl ?? ApiConfig.baseUrl;

  String get appointmentsUrl => '$_baseUrl/api/Appointments';

  // Header cơ bản
  Future<Map<String, String>> getAuthHeaders() async {
    final token = await SecureStorageService().readToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Lấy tất cả lịch hẹn (cho admin)
  Future<List<Appointment>> getAllAppointments() async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.get(
        Uri.parse(appointmentsUrl),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Appointment.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load appointments: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching all appointments: $e');
      return [];
    }
  }

  // Lấy lịch hẹn của người dùng hiện tại
  Future<List<Appointment>> getUserAppointments() async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.get(
        Uri.parse('$appointmentsUrl/user'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Appointment.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load user appointments: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching user appointments: $e');
      return [];
    }
  }

  // Lấy lịch hẹn theo trạng thái
  Future<List<Appointment>> getAppointmentsByStatus(String status) async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.get(
        Uri.parse('$appointmentsUrl/status/$status'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Appointment.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load appointments by status: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching appointments by status: $e');
      return [];
    }
  }

  // Lấy lịch hẹn theo ngày
  Future<List<Appointment>> getAppointmentsByDate(DateTime date) async {
    try {
      final formattedDate = date.toIso8601String().split('T')[0];
      final headers = await getAuthHeaders();
      final response = await _client.get(
        Uri.parse('$appointmentsUrl/date/$formattedDate'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Appointment.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load appointments by date: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching appointments by date: $e');
      return [];
    }
  }

  // Hủy lịch hẹn
  Future<bool> cancelAppointment(int appointmentId, String reason) async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.patch(
        Uri.parse('$appointmentsUrl/$appointmentId/cancel'),
        headers: headers,
        body: json.encode({'cancellationReason': reason}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error canceling appointment: $e');
      return false;
    }
  }

  // Lấy khung giờ bận của nhân viên theo ngày
  Future<List<String>> getStaffBusyTimeSlots(int staffId, DateTime date) async {
    try {
      final formattedDate = date.toIso8601String().split('T')[0];
      
      // Thử API chuyên biệt trước
      try {
        final headers = await getAuthHeaders();
        final response = await _client.get(
          Uri.parse('$_baseUrl/api/Staff/$staffId/busy-slots?date=$formattedDate'),
          headers: headers,
        );
        
        if (response.statusCode == 200) {
          final List<dynamic> data = json.decode(response.body);
          print('✅ Staff $staffId busy slots from API: $data');
          return data.map((slot) => slot.toString()).toList();
        }
      } catch (apiError) {
        print('📡 Staff busy slots API not available, using fallback method: $apiError');
      }
      
      // Fallback: lấy từ lịch làm việc của nhân viên
      final appointments = await getAppointmentsByDate(date);
      final staffAppointments = appointments.where((apt) => 
        apt.staffId == staffId && 
        !['Cancelled', 'Completed', 'No-Show'].contains(apt.status)
      ).toList();
      
      final busySlots = <String>[];
      for (final apt in staffAppointments) {
        final appointmentDate = apt.appointmentDate;
        if (appointmentDate != null) {
          final timeStr = '${appointmentDate.hour.toString().padLeft(2, '0')}:${appointmentDate.minute.toString().padLeft(2, '0')}';
          busySlots.add(timeStr);
          print('Staff $staffId busy at $timeStr (${apt.service?.name ?? 'Unknown service'}) - Status: ${apt.status}');
        }
      }
      
      return busySlots;
    } catch (e) {
      print('❌ Error fetching staff busy slots for staff $staffId: $e');
      return [];
    }
  }

  // Lấy khung giờ bận của thú cưng theo ngày
  Future<List<String>> getPetBusyTimeSlots(int petId, DateTime date) async {
    try {
      final appointments = await getAppointmentsByDate(date);
      final petAppointments = appointments.where((apt) => 
        apt.petId == petId && 
        !['Cancelled', 'Completed', 'No-Show'].contains(apt.status)
      ).toList();
      
      final busySlots = <String>[];
      for (final apt in petAppointments) {
        final appointmentDate = apt.appointmentDate;
        if (appointmentDate != null) {
          final timeStr = '${appointmentDate.hour.toString().padLeft(2, '0')}:${appointmentDate.minute.toString().padLeft(2, '0')}';
          busySlots.add(timeStr);
          print('Pet $petId busy at $timeStr (${apt.service?.name ?? 'Unknown service'}) - Status: ${apt.status}');
        }
      }
      
      return busySlots;
    } catch (e) {
      print('❌ Error fetching pet busy slots for pet $petId: $e');
      return [];
    }
  }

  // Lấy khung giờ có sẵn cho ngày và dịch vụ cụ thể
  Future<List<TimeSlot>> getAvailableTimeSlots({
    required DateTime date,
    required int serviceId,
    int? petId,
    int? staffId,
  }) async {
    try {
      final formattedDate = date.toIso8601String().split('T')[0];
      
      final queryParams = <String, String>{
        'date': formattedDate,
        'serviceId': serviceId.toString(),
      };
      
      if (petId != null) queryParams['petId'] = petId.toString();
      if (staffId != null) queryParams['staffId'] = staffId.toString();
      
      final uri = Uri.parse('$appointmentsUrl/available-slots').replace(queryParameters: queryParams);
      
      final headers = await getAuthHeaders();
      final response = await _client.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        // Nếu là List thì dùng luôn, nếu là Map thì lấy field 'slots' hoặc 'data'
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map<String, dynamic>) {
          // Thử lấy field 'slots', nếu không có thì lấy 'data', nếu không có thì lấy tất cả values
          if (decoded.containsKey('slots')) {
            data = decoded['slots'];
          } else if (decoded.containsKey('data')) {
            data = decoded['data'];
          } else {
            data = decoded.values.toList();
          }
        } else {
          throw Exception('Unknown response format for time slots');
        }
        
        // Parse time slots và thêm thông tin busy status
        final timeSlots = data.map((json) => TimeSlot.fromJson(json)).toList();
        
        // Lấy thông tin khung giờ bận nếu có petId và staffId
        if (petId != null && staffId != null) {
          final petBusySlots = await getPetBusyTimeSlots(petId, date);
          final staffBusySlots = await getStaffBusyTimeSlots(staffId, date);
          
          // Cập nhật trạng thái busy cho các time slots
          for (final slot in timeSlots) {
            final timeStr = '${slot.startTime.hour.toString().padLeft(2, '0')}:${slot.startTime.minute.toString().padLeft(2, '0')}';
            
            if (petBusySlots.contains(timeStr)) {
              slot.isPetBusy = true;
              slot.isAvailable = false;
            }
            
            if (staffBusySlots.contains(timeStr)) {
              slot.isStaffBusy = true;
              slot.isAvailable = false;
            }
          }
        }
        
        return timeSlots;
      } else {
        throw Exception('Failed to load available time slots: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching available time slots: $e');
      return _generateDefaultTimeSlots(date);
    }
  }

  // Tạo lịch hẹn mới
  Future<Appointment?> createAppointment(Map<String, dynamic> appointmentData) async {
    try {
      // Thêm thông tin múi giờ
      appointmentData['timeZoneOffset'] = DateTime.now().timeZoneOffset.inMinutes;
      
      print('Creating appointment with data: $appointmentData');
      
      final headers = await getAuthHeaders();
      final response = await _client.post(
        Uri.parse(appointmentsUrl),
        headers: headers,
        body: json.encode(appointmentData),
      );

      print('Create appointment response: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final appointment = Appointment.fromJson(data);
        
        // Tăng booking count cho service
        try {
          final serviceService = ServiceService();
          await serviceService.incrementBookingCount(appointmentData['serviceId']);
        } catch (e) {
          // Không hiển thị lỗi cho user vì đây chỉ là thống kê
          print('Failed to increment booking count: $e');
        }
        
        return appointment;
      } else {
        throw Exception('Failed to create appointment: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Error creating appointment: $e');
      throw e;
    }
  }

  // Tạo khung giờ mặc định nếu API thất bại
  List<TimeSlot> _generateDefaultTimeSlots(DateTime date) {
    final slots = <TimeSlot>[];
    
    // Giờ hoạt động: 8:00 - 21:30
    const openingHour = 8;
    const closingHour = 21;
    const closingMinute = 30;
    const slotDuration = 60; // 60 phút mỗi slot
    
    final baseDate = DateTime(date.year, date.month, date.day);
    
    for (int hour = openingHour; hour <= closingHour; hour++) {
      // Xử lý đặc biệt cho giờ cuối (21:30)
      final maxMinutes = (hour == closingHour) ? [0] : [0];
      if (hour == closingHour && closingMinute == 30) {
        maxMinutes.add(30);
      }
      
      for (final minute in maxMinutes) {
        final startTime = baseDate.add(Duration(hours: hour, minutes: minute));
        final endTime = startTime.add(const Duration(minutes: slotDuration));
        
        // Kiểm tra không vượt quá giờ đóng cửa
        if (endTime.hour > closingHour || 
            (endTime.hour == closingHour && endTime.minute > closingMinute)) {
          break;
        }
        
        // Kiểm tra không phải là quá khứ (nếu là ngày hôm nay)
        if (date.day == DateTime.now().day && 
            date.month == DateTime.now().month && 
            date.year == DateTime.now().year &&
            startTime.isBefore(DateTime.now())) {
          continue;
        }
        
        slots.add(TimeSlot(
          id: 'default_${startTime.millisecondsSinceEpoch}',
          startTime: startTime,
          endTime: endTime,
          isAvailable: true,
        ));
      }
    }
    
    return slots;
  }

  // Cập nhật trạng thái lịch hẹn
  Future<void> updateAppointmentStatus(int appointmentId, String newStatus) async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.put(
        Uri.parse('$appointmentsUrl/$appointmentId/status'),
        headers: headers,
        body: json.encode({'status': newStatus}),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to update appointment status: ${response.statusCode}');
      }
    } catch (e) {
      print('Error updating appointment status: $e');
      throw Exception('Không thể cập nhật trạng thái lịch hẹn: $e');
    }
  }
}