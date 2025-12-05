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

      return [];
    }
  }

  // Hủy lịch hẹn
  Future<bool> cancelAppointment(int appointmentId, String reason) async {
    try {
      final headers = await getAuthHeaders();

      final response = await _client.delete(
        Uri.parse('$appointmentsUrl/$appointmentId/reason'),
        headers: headers,
        body: json.encode({'Reason': reason}),  // Chữ R hoa để khớp với backend DTO
      );


      return response.statusCode == 200;
    } catch (e) {

      return false;
    }
  }

  // Kiểm tra số lần hủy lịch trong tháng
  Future<int> getCancelledCountThisMonth() async {
    try {
      final headers = await getAuthHeaders();
      final response = await _client.get(
        Uri.parse('$appointmentsUrl/cancel-count'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['count'] ?? 0;
      }
      
      return 0;
    } catch (e) {

      return 0;
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

          return data.map((slot) => slot.toString()).toList();
        }
      } catch (apiError) {

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
        }
      }
      
      return busySlots;
    } catch (e) {

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
        }
      }
      
      return busySlots;
    } catch (e) {

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
            final slotStart = slot.startTime;
            final slotEnd = slot.endTime;
            
            // ✅ Check overlap với pet busy slots (backend trả về slots 30 phút)
            for (final busyTimeStr in petBusySlots) {
              final busyParts = busyTimeStr.split(':');
              final busyHour = int.parse(busyParts[0]);
              final busyMinute = int.parse(busyParts[1]);
              final busySlotStart = DateTime(date.year, date.month, date.day, busyHour, busyMinute);
              final busySlotEnd = busySlotStart.add(const Duration(minutes: 30));
              
              // Check overlap: nếu busy slot nằm trong khoảng [slotStart, slotEnd)
              if ((busySlotStart.isBefore(slotEnd) && busySlotEnd.isAfter(slotStart)) ||
                  busySlotStart == slotStart) {
                slot.isPetBusy = true;
                slot.isAvailable = false;
                break;
              }
            }
            
            // ✅ Check overlap với staff busy slots (backend trả về slots 30 phút)
            for (final busyTimeStr in staffBusySlots) {
              final busyParts = busyTimeStr.split(':');
              final busyHour = int.parse(busyParts[0]);
              final busyMinute = int.parse(busyParts[1]);
              final busySlotStart = DateTime(date.year, date.month, date.day, busyHour, busyMinute);
              final busySlotEnd = busySlotStart.add(const Duration(minutes: 30));
              
              // Check overlap: nếu busy slot nằm trong khoảng [slotStart, slotEnd)
              if ((busySlotStart.isBefore(slotEnd) && busySlotEnd.isAfter(slotStart)) ||
                  busySlotStart == slotStart) {
                slot.isStaffBusy = true;
                slot.isAvailable = false;
                break;
              }
            }
          }
        }
        
        return timeSlots;
      } else {
        throw Exception('Failed to load available time slots: ${response.statusCode}');
      }
    } catch (e) {

      return _generateDefaultTimeSlots(date);
    }
  }

  // Tạo lịch hẹn mới
  Future<Appointment?> createAppointment(Map<String, dynamic> appointmentData) async {
    try {
      // Thêm thông tin múi giờ
      appointmentData['timeZoneOffset'] = DateTime.now().timeZoneOffset.inMinutes;

      final headers = await getAuthHeaders();
      final response = await _client.post(
        Uri.parse(appointmentsUrl),
        headers: headers,
        body: json.encode(appointmentData),
      );


      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final appointment = Appointment.fromJson(data);
        
        // Tăng booking count cho service
        try {
          final serviceService = ServiceService();
          await serviceService.incrementBookingCount(appointmentData['serviceId']);
        } catch (e) {
          // Không hiển thị lỗi cho user vì đây chỉ là thống kê

        }
        
        return appointment;
      } else {
        throw Exception('Failed to create appointment: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {

      throw e;
    }
  }

  // Tạo khung giờ mặc định nếu API thất bại
  List<TimeSlot> _generateDefaultTimeSlots(DateTime date) {
    final slots = <TimeSlot>[];
    
    // Giờ hoạt động: 8:00 - 21:30 (giống web)
    const serviceDuration = 30; // 30 phút service
    const bufferTime = 10; // 10 phút buffer
    const slotInterval = serviceDuration + bufferTime; // 40 phút interval giống web
    
    final baseDate = DateTime(date.year, date.month, date.day);
    final openingTime = baseDate.add(const Duration(hours: 8, minutes: 0)); // 08:00
    final closingTime = baseDate.add(const Duration(hours: 21, minutes: 30)); // 21:30
    
    DateTime currentTime = openingTime;
    
    // Tạo slots với interval 40 phút: 08:00, 08:40, 09:20, 10:00, 10:40...
    while (currentTime.isBefore(closingTime) || currentTime == closingTime) {
      final endTime = currentTime.add(const Duration(minutes: serviceDuration));
      
      // Kiểm tra không vượt quá giờ đóng cửa
      if (endTime.isAfter(closingTime)) {
        break;
      }
      
      // Kiểm tra không phải là quá khứ (nếu là ngày hôm nay)
      if (date.day == DateTime.now().day && 
          date.month == DateTime.now().month && 
          date.year == DateTime.now().year &&
          currentTime.isBefore(DateTime.now())) {
        currentTime = currentTime.add(const Duration(minutes: slotInterval));
        continue;
      }
      
      slots.add(TimeSlot(
        id: 'default_${currentTime.millisecondsSinceEpoch}',
        startTime: currentTime,
        endTime: endTime,
        isAvailable: true,
      ));
      
      // Chuyển đến slot tiếp theo (sau 40 phút: serviceDuration + bufferTime)
      currentTime = currentTime.add(const Duration(minutes: slotInterval));
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

      throw Exception('Không thể cập nhật trạng thái lịch hẹn: $e');
    }
  }
}
