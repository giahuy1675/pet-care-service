import 'package:flutter/material.dart';
import 'package:pet_flutter/pages/chat_list_page.dart';
import 'package:pet_flutter/pages/chat_detail_page.dart';
import 'package:pet_flutter/services/firebase_chat_service.dart';

/// Trang demo để test chức năng chat
/// Sử dụng trang này để test nhanh mà không cần tích hợp vào app chính
class ChatDemoPage extends StatefulWidget {
  const ChatDemoPage({Key? key}) : super(key: key);

  @override
  State<ChatDemoPage> createState() => _ChatDemoPageState();
}

class _ChatDemoPageState extends State<ChatDemoPage> {
  final FirebaseChatService _chatService = FirebaseChatService();
  
  // Demo data - Thay bằng data thật từ app của bạn
  final int demoCustomerId = 1;
  final String demoCustomerName = "Khách hàng Demo";
  final String demoCustomerAvatar = "";
  
  final int demoStaffId = 5;
  final String demoStaffName = "Nhân viên Demo";
  final String demoStaffAvatar = "";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat Demo'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.chat_bubble_outline,
              size: 100,
              color: Colors.blue,
            ),
            const SizedBox(height: 24),
            const Text(
              'Chức năng Chat Firebase',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'Test các tính năng chat realtime',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            
            // Test 1: Mở chat list của khách hàng
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatListPage(
                      userId: demoCustomerId,
                      isStaff: false,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.person),
              label: const Text('Xem chat của Khách hàng'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Test 2: Mở chat list của nhân viên
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatListPage(
                      userId: demoStaffId,
                      isStaff: true,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.medical_services),
              label: const Text('Xem chat của Nhân viên'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Test 3: Tạo chat room mới và bắt đầu chat
            ElevatedButton.icon(
              onPressed: () async {
                try {
                  // Tạo chat room
                  final chatRoom = await _chatService.getOrCreateChatRoom(
                    customerId: demoCustomerId,
                    customerName: demoCustomerName,
                    customerAvatar: demoCustomerAvatar,
                    staffId: demoStaffId,
                    staffName: demoStaffName,
                    staffAvatar: demoStaffAvatar,
                  );

                  // Mở trang chat
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatDetailPage(
                        chatRoomId: chatRoom.id,
                        currentUserId: demoCustomerId.toString(),
                        currentUserName: demoCustomerName,
                        currentUserAvatar: demoCustomerAvatar,
                        otherUserId: demoStaffId.toString(),
                        otherUserName: demoStaffName,
                        otherUserAvatar: demoStaffAvatar,
                      ),
                    ),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Lỗi: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.add_comment),
              label: const Text('Tạo chat mới & Test ngay'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Thông tin
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'Hướng dẫn test:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('1. Click "Tạo chat mới" để test ngay'),
                  const SizedBox(height: 4),
                  const Text('2. Gửi tin nhắn văn bản'),
                  const SizedBox(height: 4),
                  const Text('3. Thử gửi hình ảnh'),
                  const SizedBox(height: 4),
                  const Text('4. Mở 2 thiết bị để test realtime'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
