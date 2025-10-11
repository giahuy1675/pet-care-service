import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../services/staff_service.dart';
import '../models/appointment.dart';
import '../utils/format_utils.dart';

class StaffAppointmentsPage extends StatefulWidget {
  const StaffAppointmentsPage({super.key});

  @override
  State<StaffAppointmentsPage> createState() => _StaffAppointmentsPageState();
}

class _StaffAppointmentsPageState extends State<StaffAppointmentsPage> with TickerProviderStateMixin {
  final StaffService _staffService = StaffService();
  late TabController _tabController;
  
  List<Appointment> _todayAppointments = [];
  List<Appointment> _upcomingAppointments = [];
  List<Appointment> _completedAppointments = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final today = DateTime.now();
      final appointments = await _staffService.getStaffAppointments();

      // Filter appointments by date and status
      final todayAppts = appointments.where((apt) => 
        apt.appointmentDate != null &&
        apt.appointmentDate!.year == today.year &&
        apt.appointmentDate!.month == today.month &&
        apt.appointmentDate!.day == today.day
      ).toList();

      final upcomingAppts = appointments.where((apt) => 
        apt.appointmentDate != null &&
        apt.appointmentDate!.isAfter(today) &&
        (apt.status == 'Pending' || apt.status == 'Confirmed')
      ).toList();

      final completedAppts = appointments.where((apt) => 
        apt.status == 'Completed'
      ).toList();

      // Sort by appointment time
      todayAppts.sort((a, b) => a.appointmentDate!.compareTo(b.appointmentDate!));
      upcomingAppts.sort((a, b) => a.appointmentDate!.compareTo(b.appointmentDate!));
      completedAppts.sort((a, b) => b.appointmentDate!.compareTo(a.appointmentDate!));

      setState(() {
        _todayAppointments = todayAppts;
        _upcomingAppointments = upcomingAppts;
        _completedAppointments = completedAppts;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _updateAppointmentStatus(Appointment appointment, String newStatus) async {
    try {
      await _staffService.updateAppointmentStatus(appointment.appointmentId, newStatus);
      _loadAppointments(); // Refresh data
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã cập nhật trạng thái lịch hẹn thành công'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi cập nhật: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.primary.withOpacity(0.8),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const FaIcon(
                                FontAwesomeIcons.calendarCheck,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Quản lý lịch hẹn',
                                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    'Xem và cập nhật lịch hẹn',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: _loadAppointments,
                              icon: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const FaIcon(
                                  FontAwesomeIcons.arrowsRotate,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: Colors.white,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min, // Thêm để tối ưu không gian
                    children: [
                      const FaIcon(FontAwesomeIcons.calendarDay, size: 14), // Giảm size icon
                      const SizedBox(width: 6), // Giảm khoảng cách
                      Flexible( // Thêm Flexible để tránh overflow
                        child: Text(
                          'Hôm nay (${_todayAppointments.length})',
                          style: const TextStyle(fontSize: 12), // Giảm font size
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const FaIcon(FontAwesomeIcons.clock, size: 14),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          'Sắp tới (${_upcomingAppointments.length})',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const FaIcon(FontAwesomeIcons.checkCircle, size: 14),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          'Hoàn thành (${_completedAppointments.length})',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        FaIcon(
                          FontAwesomeIcons.exclamationTriangle,
                          color: Colors.red,
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Lỗi tải dữ liệu',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadAppointments,
                          icon: const FaIcon(FontAwesomeIcons.arrowsRotate, size: 16),
                          label: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildAppointmentsList(_todayAppointments, 'today'),
                      _buildAppointmentsList(_upcomingAppointments, 'upcoming'),
                      _buildAppointmentsList(_completedAppointments, 'completed'),
                    ],
                  ),
      ),
    );
  }

  Widget _buildAppointmentsList(List<Appointment> appointments, String type) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FaIcon(
              FontAwesomeIcons.calendarXmark,
              color: Colors.grey.shade400,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              type == 'today' 
                  ? 'Không có lịch hẹn hôm nay'
                  : type == 'upcoming'
                      ? 'Không có lịch hẹn sắp tới'
                      : 'Chưa có lịch hẹn hoàn thành',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              type == 'today' 
                  ? 'Hôm nay bạn không có lịch hẹn nào'
                  : type == 'upcoming'
                      ? 'Tất cả lịch hẹn đã được xử lý'
                      : 'Lịch sử lịch hẹn hoàn thành sẽ hiển thị ở đây',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAppointments,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final appointment = appointments[index];
          return _buildAppointmentCard(appointment, type);
        },
      ),
    );
  }

  Widget _buildAppointmentCard(Appointment appointment, String type) {
    final timeStr = appointment.appointmentDate != null
        ? FormatUtils.formatTime(appointment.appointmentDate!)
        : 'N/A';
    
    final dateStr = appointment.appointmentDate != null
        ? FormatUtils.formatDate(appointment.appointmentDate!)
        : 'N/A';

    Color statusColor = Colors.grey;
    String statusText = appointment.status ?? 'Unknown';
    
    switch (appointment.status) {
      case 'Pending':
        statusColor = Colors.orange;
        statusText = 'Chờ xác nhận';
        break;
      case 'Confirmed':
        statusColor = Colors.blue;
        statusText = 'Đã xác nhận';
        break;
      case 'Completed':
        statusColor = Colors.green;
        statusText = 'Hoàn thành';
        break;
      case 'Cancelled':
        statusColor = Colors.red;
        statusText = 'Đã hủy';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _showAppointmentDetails(appointment),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        appointment.service?.name ?? 'Dịch vụ không xác định',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Customer info
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: FaIcon(
                        FontAwesomeIcons.user,
                        color: Colors.blue.shade600,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appointment.user?.fullName ?? 'Khách hàng không xác định',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (appointment.user?.email != null)
                            Text(
                              appointment.user!.email,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey.shade600,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Time and date
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: FaIcon(
                        FontAwesomeIcons.clock,
                        color: Colors.green.shade600,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$timeStr - $dateStr',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                
                // Pet info if available
                if (appointment.pet != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: FaIcon(
                          FontAwesomeIcons.paw,
                          color: Colors.orange.shade600,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${appointment.pet!.name} (${appointment.pet!.species})',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                
                // Action buttons for pending/confirmed appointments
                if (type != 'completed' && (appointment.status == 'Pending' || appointment.status == 'Confirmed')) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      if (appointment.status == 'Pending')
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _updateAppointmentStatus(appointment, 'Confirmed'),
                            icon: const FaIcon(FontAwesomeIcons.check, size: 14),
                            label: const Text('Xác nhận'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.blue,
                              side: const BorderSide(color: Colors.blue),
                            ),
                          ),
                        ),
                      if (appointment.status == 'Pending') const SizedBox(width: 12),
                      if (appointment.status == 'Confirmed')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _updateAppointmentStatus(appointment, 'Completed'),
                            icon: const FaIcon(FontAwesomeIcons.checkCircle, size: 14),
                            label: const Text('Hoàn thành'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      if (appointment.status == 'Confirmed') const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _updateAppointmentStatus(appointment, 'Cancelled'),
                          icon: const FaIcon(FontAwesomeIcons.xmark, size: 14),
                          label: const Text('Hủy'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
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
      ),
    );
  }

  void _showAppointmentDetails(Appointment appointment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      'Chi tiết lịch hẹn',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Service info
                    _buildDetailRow(
                      FontAwesomeIcons.stethoscope,
                      'Dịch vụ',
                      appointment.service?.name ?? 'Không xác định',
                      Colors.blue,
                    ),
                    
                    // Customer info
                    _buildDetailRow(
                      FontAwesomeIcons.user,
                      'Khách hàng',
                      appointment.user?.fullName ?? 'Không xác định',
                      Colors.green,
                    ),
                    
                    // Pet info
                    if (appointment.pet != null)
                      _buildDetailRow(
                        FontAwesomeIcons.paw,
                        'Thú cưng',
                        '${appointment.pet!.name} (${appointment.pet!.species})',
                        Colors.orange,
                      ),
                    
                    // Date and time
                    _buildDetailRow(
                      FontAwesomeIcons.calendar,
                      'Ngày hẹn',
                      appointment.appointmentDate != null 
                          ? FormatUtils.formatDate(appointment.appointmentDate!)
                          : 'Không xác định',
                      Colors.purple,
                    ),
                    
                    _buildDetailRow(
                      FontAwesomeIcons.clock,
                      'Giờ hẹn',
                      appointment.appointmentDate != null 
                          ? FormatUtils.formatTime(appointment.appointmentDate!)
                          : 'Không xác định',
                      Colors.indigo,
                    ),
                    
                    // Status
                    _buildDetailRow(
                      FontAwesomeIcons.info,
                      'Trạng thái',
                      appointment.status ?? 'Không xác định',
                      Colors.grey,
                    ),
                    
                    // Notes if available
                    if (appointment.notes != null && appointment.notes!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Ghi chú',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          appointment.notes!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            // Close button
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đóng'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: FaIcon(
              icon,
              color: color,
              size: 16,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
