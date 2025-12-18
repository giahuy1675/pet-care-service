import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:lottie/lottie.dart';
import 'package:pet_flutter/services/secure_storage.dart';
import 'package:pet_flutter/services/user_service.dart';
import 'package:pet_flutter/services/biometric_auth_service.dart';
import 'package:pet_flutter/widgets/change_password_dialog.dart';
import 'package:pet_flutter/widgets/shimmer_placeholders.dart';
import 'package:pet_flutter/utils/logout_helper.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, this.initialToken, this.initialUserId});

  final String? initialToken;
  final int? initialUserId;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _roleController = TextEditingController();
  final _avatarController = TextEditingController();
  final _userService = UserService();
  final _storage = SecureStorageService();
  final _biometricAuth = BiometricAuthService();

  int? _userId;
  String? _token;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  
  // Biometric states
  bool _biometricSupported = false;
  bool _biometricEnabled = false;
  String _biometricType = 'Sinh trắc học';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      // Prefer values passed from caller
      String? token = widget.initialToken;
      int? uid = widget.initialUserId;

      // Fallback to secure storage
      final userJson = await _storage.readUser();
      token ??= await _storage.readToken();
      if (token == null || userJson == null) {
        setState(() {
          _error = 'Chưa đăng nhập';
          _loading = false;
        });
        return;
      }
      final map = jsonDecode(userJson) as Map<String, dynamic>;
      uid = uid ?? (map['userId'] as num?)?.toInt();
      if (uid == null) {
        setState(() {
          _error = 'Thiếu userId';
          _loading = false;
        });
        return;
      }
      _userId = uid;
      _token = token;
      final profile = await _userService.getUser(userId: uid, token: token);
      _emailController.text = profile['email'] as String? ?? '';
      _fullNameController.text = profile['fullName'] as String? ?? '';
      _phoneController.text = profile['phone'] as String? ?? '';
      _addressController.text = profile['address'] as String? ?? '';
      _roleController.text = profile['role'] as String? ?? 'Customer';
      _avatarController.text = profile['avatar'] as String? ?? '';
      
      // Load biometric settings
      await _loadBiometricSettings();
      
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _refresh() async {
    await _bootstrap(showLoading: false);
  }

  Future<void> _loadBiometricSettings() async {
    try {
      final supported = await _biometricAuth.isDeviceSupported();
      final canCheck = await _biometricAuth.canCheckBiometrics();
      final enabled = await _storage.isBiometricEnabled();
      final typeName = await _biometricAuth.getBiometricTypeName();
      
      // Kiểm tra xem email đã lưu có khớp với email hiện tại không
      final savedEmail = await _storage.getBiometricEmail();
      final currentEmail = _emailController.text.trim();
      
      bool shouldEnable = enabled;
      
      // Nếu có email đã lưu nhưng KHÔNG KHỚP với email hiện tại
      if (enabled && savedEmail != null && savedEmail.isNotEmpty) {
        if (savedEmail.toLowerCase() != currentEmail.toLowerCase()) {
          // Email không khớp → Tự động TẮT biometric cho tài khoản này
          shouldEnable = false;
          // Không xóa thông tin cũ, giữ lại cho tài khoản cũ
        }
      }
      
      if (mounted) {
        setState(() {
          _biometricSupported = supported && canCheck;
          _biometricEnabled = shouldEnable;
          _biometricType = typeName;
        });
      }
    } catch (e) {
      // Ignore errors loading biometric settings
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _userId == null || _token == null) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      // Check if user is admin (simplified check - in real app, get from token)
      final isAdmin = _roleController.text.toLowerCase() == 'admin';
      
      await _userService.updateUser(
        userId: _userId!,
        token: _token!,
        email: _emailController.text.trim(),
        fullName: _fullNameController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        // Only send role if user is admin, otherwise let backend set default
        role: isAdmin ? _roleController.text.trim() : null,
        avatar: _avatarController.text.trim().isEmpty ? null : _avatarController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Đã lưu thông tin thành công'),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${_parseErrorMessage(e.toString())}'),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  String _parseErrorMessage(String error) {
    // Parse common error messages to user-friendly text
    if (error.contains('Email không hợp lệ')) {
      return 'Email không hợp lệ';
    } else if (error.contains('Họ tên là bắt buộc')) {
      return 'Họ tên là bắt buộc';
    } else if (error.contains('Số điện thoại không hợp lệ')) {
      return 'Số điện thoại không hợp lệ';
    } else if (error.contains('Bạn không có quyền')) {
      return 'Bạn không có quyền thực hiện hành động này';
    } else if (error.contains('Không tìm thấy người dùng')) {
      return 'Không tìm thấy thông tin người dùng';
    } else if (error.contains('Dữ liệu không hợp lệ')) {
      return 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
    } else {
      return error;
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _roleController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Hồ sơ cá nhân'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? _buildShimmerBody()
          : _error != null
              ? Center(
              child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.error_outline,
                              size: 64,
                              color: Colors.red.shade400,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Có lỗi xảy ra',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: Colors.red.shade700,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: _bootstrap,
                            icon: const FaIcon(FontAwesomeIcons.arrowsRotate),
                            label: const Text('Thử lại'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _refresh,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                      // Profile Header
                      _buildProfileHeader(context),
                      const SizedBox(height: 24),
                      
                      // Quick Stats
                      _buildQuickStats(context),
                      const SizedBox(height: 24),
                      
                      // Menu Sections
                      _buildMenuSection(
                        context,
                        title: 'Thông tin cá nhân',
                        icon: Icons.person,
                        children: [
                          _buildMenuItem(
                            context,
                            icon: Icons.edit,
                            title: 'Chỉnh sửa thông tin',
                            subtitle: 'Cập nhật thông tin cá nhân',
                            onTap: () => _showEditProfileDialog(context),
                          ),
                          _buildMenuItem(
                            context,
                            icon: Icons.security,
                            title: 'Bảo mật',
                            subtitle: 'Đổi mật khẩu, xác thực 2FA',
                            onTap: () => _showSecurityDialog(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      _buildMenuSection(
                        context,
                        title: 'Dịch vụ & Hỗ trợ',
                        icon: Icons.support_agent,
                        children: [
                          _buildMenuItem(
                            context,
                            icon: Icons.help_outline,
                            title: 'Trung tâm trợ giúp',
                            subtitle: 'Câu hỏi thường gặp, hướng dẫn',
                            onTap: () => _showHelpDialog(context),
                          ),
                          _buildMenuItem(
                            context,
                            icon: Icons.contact_support,
                            title: 'Liên hệ hỗ trợ',
                            subtitle: 'Gửi phản hồi, báo cáo lỗi',
                            onTap: () => _showContactDialog(context),
                          ),
                          _buildMenuItem(
                            context,
                            icon: Icons.star_outline,
                            title: 'Đánh giá ứng dụng',
                            subtitle: 'Chia sẻ trải nghiệm của bạn',
                            onTap: () => _showRatingDialog(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      _buildMenuSection(
                        context,
                        title: 'Cài đặt',
                        icon: Icons.settings,
                        children: [
                          _buildMenuItem(
                            context,
                            icon: Icons.notifications_outlined,
                            title: 'Thông báo',
                            subtitle: 'Quản lý thông báo đẩy',
                            onTap: () => _showNotificationDialog(context),
                          ),
                          _buildMenuItem(
                            context,
                            icon: Icons.privacy_tip_outlined,
                            title: 'Quyền riêng tư',
                            subtitle: 'Chính sách bảo mật, quyền riêng tư',
                            onTap: () => _showPrivacyDialog(context),
                          ),
                          _buildMenuItem(
                            context,
                            icon: Icons.info_outline,
                            title: 'Về ứng dụng',
                            subtitle: 'Phiên bản, thông tin phát triển',
                            onTap: () => _showAboutDialog(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Logout Button
                      _buildLogoutButton(context),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
    );
  }

  Widget _buildProfileHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            spreadRadius: 1,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Avatar với preview thực tế
          GestureDetector(
            onTap: () => _showAvatarOptions(context),
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: _avatarController.text.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        _avatarController.text,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Text(
                              (_fullNameController.text.isNotEmpty 
                                  ? _fullNameController.text[0].toUpperCase() 
                                  : 'U'),
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  : Center(
                      child: Text(
                        (_fullNameController.text.isNotEmpty 
                            ? _fullNameController.text[0].toUpperCase() 
                            : 'U'),
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Name
          Text(
            _fullNameController.text.isNotEmpty ? _fullNameController.text : 'Người dùng',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          
          // Email
          Text(
            _emailController.text.isNotEmpty ? _emailController.text : 'user@example.com',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 16),
          
          // Status Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Đang hoạt động',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white,
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

  Widget _buildQuickStats(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            context,
            icon: FontAwesomeIcons.paw,
            title: 'Thú cưng',
            value: '2',
            color: Colors.orange,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Chuyển đến trang thú cưng')),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            icon: FontAwesomeIcons.calendarCheck,
            title: 'Lịch hẹn',
            value: '5',
            color: Colors.blue,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Chuyển đến trang lịch hẹn')),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            icon: FontAwesomeIcons.star,
            title: 'Đánh giá',
            value: '4.8',
            color: Colors.amber,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Xem đánh giá của bạn')),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
                padding: const EdgeInsets.all(16),
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
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: FaIcon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
                          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: Theme.of(context).colorScheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return Container(
      width: double.infinity,
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
          onTap: () => LogoutHelper.showLogoutDialog(context),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.logout,
                    color: Colors.red,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Đăng xuất',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.red,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.red.shade300,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Dialog methods
  void _showEditProfileDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 10,
        child: Container(
          width: double.maxFinite,
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                Colors.grey.shade50,
              ],
            ),
          ),
          child: Column(
            children: [
              // Header với gradient
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.primary.withOpacity(0.8),
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const FaIcon(
                        FontAwesomeIcons.userEdit,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Chỉnh sửa thông tin',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Cập nhật thông tin cá nhân của bạn',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const FaIcon(
                        FontAwesomeIcons.xmark,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Form content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        // Avatar section
                        _buildAvatarSection(),
                        const SizedBox(height: 24),
                        
                        // Form fields
                        _buildModernTextField(
                          controller: _emailController,
                          label: 'Email',
                          icon: FontAwesomeIcons.envelope,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => (v == null || !v.contains('@')) ? 'Email không hợp lệ' : null,
                        ),
                        const SizedBox(height: 16),
                        
                        _buildModernTextField(
                          controller: _fullNameController,
                          label: 'Họ và tên',
                          icon: FontAwesomeIcons.user,
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập họ tên' : null,
                        ),
                        const SizedBox(height: 16),
                        
                        _buildModernTextField(
                          controller: _phoneController,
                          label: 'Số điện thoại',
                          icon: FontAwesomeIcons.phone,
                          keyboardType: TextInputType.phone,
                          validator: (v) {
                            if (v != null && v.trim().isNotEmpty) {
                              // Basic phone validation - should contain only digits, +, -, (, ), spaces
                              final phoneRegex = RegExp(r'^[\+]?[0-9\s\-\(\)]{10,15}$');
                              if (!phoneRegex.hasMatch(v.trim())) {
                                return 'Số điện thoại không hợp lệ';
                              }
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        
                        _buildModernTextField(
                          controller: _addressController,
                          label: 'Địa chỉ',
                          icon: FontAwesomeIcons.locationDot,
                          maxLines: 2,
                        ),
                        const SizedBox(height: 16),
                        
                        _buildModernTextField(
                          controller: _roleController,
                          label: 'Vai trò',
                          icon: FontAwesomeIcons.userTag,
                          helperText: 'Chỉ admin mới có thể thay đổi vai trò',
                          readOnly: true,
                        ),
                        const SizedBox(height: 16),
                        
                        _buildModernTextField(
                          controller: _avatarController,
                          label: 'Avatar URL (tùy chọn)',
                          icon: FontAwesomeIcons.image,
                          helperText: 'Để trống sẽ dùng ảnh mặc định',
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Action buttons
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(20),
                    bottomRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const FaIcon(FontAwesomeIcons.xmark, size: 16),
                        label: const Text('Hủy'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _saving ? null : () async {
                          await _save();
                          if (mounted) Navigator.pop(ctx);
                        },
                        icon: _saving 
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const FaIcon(FontAwesomeIcons.floppyDisk, size: 16),
                        label: Text(_saving ? 'Đang lưu...' : 'Lưu thay đổi'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Avatar preview
          Stack(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary,
                      Theme.of(context).colorScheme.primary.withOpacity(0.7),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      spreadRadius: 2,
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: _avatarController.text.isNotEmpty
                    ? ClipOval(
                        child: Image.network(
                          _avatarController.text,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: FaIcon(
                                FontAwesomeIcons.user,
                                color: Colors.white,
                                size: 32,
                              ),
                            );
                          },
                        ),
                      )
                    : const Center(
                        child: FaIcon(
                          FontAwesomeIcons.user,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
              ),
              // Online status indicator with animation
              Positioned(
                right: -2,
                bottom: -2,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(2),
                  child: ClipOval(
                    child: Lottie.asset(
                      'assets/animations/alert_on.json',
                      width: 24,
                      height: 24,
                      fit: BoxFit.cover,
                      repeat: true,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Ảnh đại diện',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Nhập URL ảnh để cập nhật avatar',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    String? helperText,
    int maxLines = 1,
    bool readOnly = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        maxLines: maxLines,
        readOnly: readOnly,
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 16, right: 12),
            child: FaIcon(
              icon,
              size: 18,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          prefixIconConstraints: const BoxConstraints(
            minWidth: 48,
            minHeight: 24,
          ),
          filled: true,
          fillColor: readOnly ? Colors.grey.shade100 : Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey.shade300,
              width: 1,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.grey.shade300,
              width: 1,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Theme.of(context).colorScheme.primary,
              width: 2,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.red.shade400,
              width: 1,
            ),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: Colors.red.shade400,
              width: 2,
            ),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          labelStyle: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
          ),
          floatingLabelStyle: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  void _showAvatarOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
                        ),
                        const SizedBox(height: 20),
            
            Text(
              'Cập nhật ảnh đại diện',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Chọn cách cập nhật ảnh đại diện của bạn',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            
            // Options
            Row(
              children: [
                Expanded(
                  child: _buildAvatarOption(
                    context,
                    icon: FontAwesomeIcons.link,
                    title: 'Nhập URL',
                    subtitle: 'Dán link ảnh',
                    onTap: () {
                      Navigator.pop(ctx);
                      _showUrlInputDialog(context);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildAvatarOption(
                    context,
                    icon: FontAwesomeIcons.camera,
                    title: 'Chụp ảnh',
                    subtitle: 'Camera',
                    onTap: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tính năng chụp ảnh đang được phát triển'),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildAvatarOption(
                    context,
                    icon: FontAwesomeIcons.image,
                    title: 'Thư viện',
                    subtitle: 'Chọn ảnh',
                    onTap: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tính năng chọn ảnh đang được phát triển'),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.grey.shade200,
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: FaIcon(
                  icon,
                  color: Theme.of(context).colorScheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                  fontSize: 10,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUrlInputDialog(BuildContext context) {
    final urlController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Nhập URL ảnh'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            labelText: 'URL ảnh',
            hintText: 'https://example.com/avatar.jpg',
            prefixIcon: Icon(Icons.link),
          ),
          keyboardType: TextInputType.url,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
                        ElevatedButton(
            onPressed: () {
              if (urlController.text.trim().isNotEmpty) {
                setState(() {
                  _avatarController.text = urlController.text.trim();
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Đã cập nhật URL ảnh đại diện'),
                  ),
                );
              }
            },
            child: const Text('Cập nhật'),
                        ),
                      ],
                    ),
    );
  }

  void _showSecurityDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 10,
          child: Container(
            width: double.maxFinite,
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.8,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  Colors.grey.shade50,
                ],
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header với gradient
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Theme.of(context).colorScheme.primary,
                        Theme.of(context).colorScheme.primary.withOpacity(0.8),
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const FaIcon(
                          FontAwesomeIcons.shield,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bảo mật',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Quản lý bảo mật tài khoản',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const FaIcon(
                          FontAwesomeIcons.xmark,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Change Password Section
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.shade200,
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            leading: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.orange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const FaIcon(
                                FontAwesomeIcons.lock,
                                color: Colors.orange,
                                size: 20,
                              ),
                            ),
                            title: const Text(
                              'Đổi mật khẩu',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                            subtitle: const Text(
                              'Cập nhật mật khẩu mới',
                              style: TextStyle(fontSize: 13),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const FaIcon(
                                FontAwesomeIcons.chevronRight,
                                size: 14,
                                color: Colors.grey,
                              ),
                            ),
                            onTap: () {
                              Navigator.pop(ctx);
                              showDialog(
                                context: context,
                                builder: (changeCtx) => ChangePasswordDialog(
                                  userId: _userId!,
                                  token: _token!,
                                  onPasswordChanged: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Đổi mật khẩu thành công!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Biometric Authentication Section
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.shade200,
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                leading: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: _biometricSupported
                                        ? Colors.blue.withOpacity(0.1)
                                        : Colors.grey.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: FaIcon(
                                    FontAwesomeIcons.fingerprint,
                                    color: _biometricSupported ? Colors.blue : Colors.grey,
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  'Đăng nhập bằng $_biometricType',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                    color: _biometricSupported ? null : Colors.grey,
                                  ),
                                ),
                                subtitle: Text(
                                  _biometricSupported
                                      ? 'Sử dụng $_biometricType để đăng nhập nhanh'
                                      : 'Thiết bị không hỗ trợ sinh trắc học',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: _biometricSupported ? null : Colors.grey,
                                  ),
                                ),
                                trailing: Switch(
                                  value: _biometricEnabled,
                                  activeColor: Theme.of(context).colorScheme.primary,
                                  onChanged: _biometricSupported
                                      ? (value) async {
                                          if (value) {
                                            // Bật biometric
                                            await _enableBiometric(context, setDialogState);
                                          } else {
                                            // Tắt biometric
                                            await _disableBiometric(setDialogState);
                                          }
                                        }
                                      : null,
                                ),
                              ),
                              if (!_biometricSupported)
                                Container(
                                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.amber.shade200,
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      FaIcon(
                                        FontAwesomeIcons.circleInfo,
                                        size: 14,
                                        color: Colors.amber.shade700,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Vui lòng thiết lập vân tay hoặc Face ID trong Cài đặt thiết bị',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.amber.shade900,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _enableBiometric(BuildContext context, StateSetter setDialogState) async {
    // Kiểm tra xem đã lưu thông tin đăng nhập chưa
    final savedEmail = await _storage.getBiometricEmail();
    final currentEmail = _emailController.text.trim();
    
    // Kiểm tra xem có thông tin của TÀI KHOẢN KHÁC không
    if (savedEmail != null && savedEmail.isNotEmpty && 
        savedEmail.toLowerCase() != currentEmail.toLowerCase()) {
      // Có thông tin của tài khoản khác, hỏi xem có muốn thay thế không
      if (!context.mounted) return;
      
      final shouldReplace = await _showReplaceAccountDialog(context, savedEmail, currentEmail);
      if (shouldReplace != true) return;
      
      // User đồng ý thay thế, tiếp tục thiết lập
    }
    
    if (savedEmail == null || savedEmail.isEmpty || 
        savedEmail.toLowerCase() != currentEmail.toLowerCase()) {
      // Chưa có thông tin hoặc thông tin của tài khoản khác, hiển thị dialog để nhập
      if (!context.mounted) return;
      
      final credentials = await _showBiometricSetupDialog(context);
      if (credentials == null) return;
      
      // Xác thực sinh trắc học để bật
      final result = await _biometricAuth.authenticate(
        localizedReason: 'Xác thực để bật đăng nhập bằng sinh trắc học',
      );
      
      if (result.success) {
        // Lưu thông tin đăng nhập
        await _storage.saveBiometricCredentials(
          credentials['email']!,
          credentials['password']!,
        );
        await _storage.saveBiometricEnabled(true);
        
        setDialogState(() {
          _biometricEnabled = true;
        });
        setState(() {
          _biometricEnabled = true;
        });
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đã bật đăng nhập bằng $_biometricType'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else if (!result.isUserCanceled && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.errorMessage ?? 'Xác thực thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else {
      // Đã có thông tin, chỉ cần xác thực để bật
      final result = await _biometricAuth.authenticate(
        localizedReason: 'Xác thực để bật đăng nhập bằng sinh trắc học',
      );
      
      if (result.success) {
        await _storage.saveBiometricEnabled(true);
        
        setDialogState(() {
          _biometricEnabled = true;
        });
        setState(() {
          _biometricEnabled = true;
        });
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đã bật đăng nhập bằng $_biometricType'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else if (!result.isUserCanceled && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.errorMessage ?? 'Xác thực thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _disableBiometric(StateSetter setDialogState) async {
    await _storage.saveBiometricEnabled(false);
    
    setDialogState(() {
      _biometricEnabled = false;
    });
    setState(() {
      _biometricEnabled = false;
    });
  }

  Future<Map<String, String>?> _showBiometricSetupDialog(BuildContext context) async {
    final emailController = TextEditingController(text: _emailController.text);
    final passwordController = TextEditingController();
    bool obscurePassword = true;
    
    return showDialog<Map<String, String>>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Thiết lập đăng nhập sinh trắc học'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Nhập thông tin đăng nhập của bạn để lưu trữ an toàn',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passwordController,
                  obscureText: obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    prefixIcon: const Icon(Icons.lock),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscurePassword ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setDialogState(() {
                          obscurePassword = !obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                if (emailController.text.isEmpty || passwordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Vui lòng nhập đầy đủ thông tin'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }
                Navigator.pop(ctx, {
                  'email': emailController.text,
                  'password': passwordController.text,
                });
              },
              child: const Text('Xác nhận'),
            ),
          ],
        ),
      ),
    );
  }

  Future<bool?> _showReplaceAccountDialog(BuildContext context, String oldEmail, String newEmail) async {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange.shade600),
            const SizedBox(width: 8),
            const Expanded(child: Text('Thay đổi tài khoản?')),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Đã có tài khoản khác đang sử dụng đăng nhập vân tay:',
                style: TextStyle(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.person_off, color: Colors.red.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tài khoản cũ:',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                          Text(
                            oldEmail,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.red.shade800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.person, color: Colors.green.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tài khoản mới:',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                          Text(
                            newEmail,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.green.shade800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange.shade700, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Nếu tiếp tục, tài khoản cũ sẽ KHÔNG thể đăng nhập bằng vân tay nữa.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.orange.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
            ),
            child: const Text('Thay thế'),
          ),
        ],
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Trung tâm trợ giúp'),
        content: const Text('Tính năng đang được phát triển'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
            ),
    );
  }

  void _showContactDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Liên hệ hỗ trợ'),
        content: const Text('Tính năng đang được phát triển'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Đánh giá ứng dụng'),
        content: const Text('Tính năng đang được phát triển'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showNotificationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Thông báo'),
        content: const Text('Tính năng đang được phát triển'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Quyền riêng tư'),
        content: const Text('Tính năng đang được phát triển'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Về ứng dụng'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Phiên bản: 1.0.0'),
            SizedBox(height: 8),
            Text('Phát triển bởi: Pet Care Team'),
            SizedBox(height: 8),
            Text('Ứng dụng chăm sóc thú cưng toàn diện'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerBody() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile Header Shimmer
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                const ShimmerAvatar(size: 120),
                const SizedBox(height: 16),
                Center(
                  child: ShimmerText(width: 150, height: 24),
                ),
                const SizedBox(height: 8),
                Center(
                  child: ShimmerText(width: 120, height: 16),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Quick Stats Shimmer
          Row(
            children: [
              Expanded(
                child: ShimmerCard(
                  width: double.infinity,
                  height: 100,
                  borderRadius: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ShimmerCard(
                  width: double.infinity,
                  height: 100,
                  borderRadius: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ShimmerCard(
                  width: double.infinity,
                  height: 100,
                  borderRadius: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Menu Section Shimmer
          ShimmerCard(
            width: double.infinity,
            height: 180,
            borderRadius: 20,
          ),
          const SizedBox(height: 16),
          
          ShimmerCard(
            width: double.infinity,
            height: 240,
            borderRadius: 20,
          ),
          const SizedBox(height: 16),
          
          ShimmerCard(
            width: double.infinity,
            height: 120,
            borderRadius: 20,
          ),
        ],
      ),
    );
  }
}


