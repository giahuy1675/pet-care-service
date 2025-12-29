import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:pet_flutter/config/api_config.dart';
import 'package:pet_flutter/services/secure_storage.dart';
import 'package:pet_flutter/models/appointment.dart';
import 'package:pet_flutter/pages/appointment_detail_page.dart';

class TodayAppointmentsPage extends StatefulWidget {
  const TodayAppointmentsPage({super.key});

  @override
  State<TodayAppointmentsPage> createState() => _TodayAppointmentsPageState();
}

class _TodayAppointmentsPageState extends State<TodayAppointmentsPage> {
  List<Map<String, dynamic>> _appointments = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTodayAppointments();
  }

  Future<void> _loadTodayAppointments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final token = await SecureStorageService().readToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/Appointments'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);
        final tomorrow = today.add(const Duration(days: 1));

        // Lọc chỉ lấy lịch hẹn hôm nay và chưa hoàn thành
        final todayAppointments = data.where((apt) {
          final aptDate = DateTime.parse(apt['appointmentDate']);
          final aptDateTime = DateTime(aptDate.year, aptDate.month, aptDate.day);
          final status = apt['status']?.toString().toLowerCase() ?? '';
          
          return aptDateTime.isAtSameMomentAs(today) && 
                 status != 'completed' && 
                 status != 'cancelled';
        }).toList();

        // Sắp xếp theo thời gian
        todayAppointments.sort((a, b) {
          final dateA = DateTime.parse(a['appointmentDate']);
          final dateB = DateTime.parse(b['appointmentDate']);
          return dateA.compareTo(dateB);
        });

        setState(() {
          _appointments = todayAppointments.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      } else {
        throw Exception('Không thể tải danh sách lịch hẹn');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'scheduled':
        return 'Đã đặt lịch';
      case 'inprogress':
        return 'Đang thực hiện';
      default:
        return 'Không xác định';
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return FontAwesomeIcons.clock;
      case 'confirmed':
        return FontAwesomeIcons.circleCheck;
      case 'completed':
        return FontAwesomeIcons.check;
      case 'cancelled':
        return FontAwesomeIcons.xmark;
      case 'scheduled':
        return FontAwesomeIcons.calendarCheck;
      case 'inprogress':
        return FontAwesomeIcons.spinner;
      default:
        return FontAwesomeIcons.circleInfo;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Lịch hẹn hôm nay'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const FaIcon(
                        FontAwesomeIcons.circleExclamation,
                        size: 64,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Không thể tải lịch hẹn',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey,
                            ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadTodayAppointments,
                        icon: const FaIcon(FontAwesomeIcons.arrowsRotate, size: 16),
                        label: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : _appointments.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const FaIcon(
                            FontAwesomeIcons.calendarCheck,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Không có lịch hẹn hôm nay',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Colors.grey.shade700,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Bạn không có lịch hẹn nào trong hôm nay',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey.shade500,
                                ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadTodayAppointments,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _appointments.length,
                        itemBuilder: (context, index) {
                          final appointment = _appointments[index];
                          final appointmentDate = DateTime.parse(appointment['appointmentDate']);
                          final timeFormat = DateFormat('HH:mm');
                          final dateFormat = DateFormat('dd/MM/yyyy');
                          final statusColor = _getStatusColor(appointment['status']);
                          final statusText = _getStatusText(appointment['status']);
                          final statusIcon = _getStatusIcon(appointment['status']);
                          final priceFormat = NumberFormat('#,###');
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 2,
                            shadowColor: Colors.black.withOpacity(0.08),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () async {
                                try {
                                  final apt = Appointment.fromJson(appointment);
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => AppointmentDetailPage(appointment: apt),
                                    ),
                                  );
                                  _loadTodayAppointments();
                                } catch (e) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Không thể mở chi tiết: $e')),
                                  );
                                }
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Header with status and price
                                    Row(
                                      children: [
                                        // Status badge
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: statusColor.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: statusColor.withOpacity(0.2),
                                              width: 1,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              FaIcon(statusIcon, size: 12, color: statusColor),
                                              const SizedBox(width: 6),
                                              Text(
                                                statusText,
                                                style: TextStyle(
                                                  color: statusColor,
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const Spacer(),
                                        // Price
                                        Text(
                                          '${priceFormat.format(appointment['servicePrice'] ?? 0)} VNĐ',
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    
                                    // Service name
                                    Row(
                                      children: [
                                        Expanded(
                                          child: RichText(
                                            text: TextSpan(
                                              style: const TextStyle(fontSize: 14),
                                              children: [
                                                TextSpan(
                                                  text: 'Dịch vụ: ',
                                                  style: TextStyle(
                                                    color: Colors.grey.shade600,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                TextSpan(
                                                  text: appointment['serviceName'] ?? 'N/A',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.black87,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    
                                    // Pet info
                                    Row(
                                      children: [
                                        Text(
                                          'Thú cưng: ',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade600,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        Text(
                                          appointment['petName'] ?? 'N/A',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.black87,
                                          ),
                                        ),
                                      ],
                                    ),
                                    
                                    // Staff info
                                    if (appointment['staffName'] != null && appointment['staffName'].toString().isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 12),
                                        child: Row(
                                          children: [
                                            Text(
                                              'Nhân viên: ',
                                              style: TextStyle(
                                                fontSize: 14,
                                                color: Colors.grey.shade600,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            Text(
                                              appointment['staffName'],
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    const SizedBox(height: 12),
                                    
                                    // Date & Time info
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: Row(
                                        children: [
                                          const FaIcon(
                                            FontAwesomeIcons.calendar,
                                            size: 14,
                                            color: Colors.green,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            '${dateFormat.format(appointmentDate)} - ${timeFormat.format(appointmentDate)}',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color: Colors.green.shade700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    
                                    // Notes if any
                                    if (appointment['notes'] != null && appointment['notes'].toString().isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const FaIcon(
                                            FontAwesomeIcons.noteSticky,
                                            size: 14,
                                            color: Colors.amber,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              appointment['notes'],
                                              style: TextStyle(
                                                color: Colors.amber.shade700,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
