import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../models/chat_models.dart';
import 'chat_api_service.dart';

class FirebaseChatService {
  final DatabaseReference _database = FirebaseDatabase.instance.ref();
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final ChatApiService _chatApiService = ChatApiService();

  // Tạo chat room từ appointment (Grab style - mỗi appointment 1 chat riêng)
  Future<ChatRoom> createChatRoomFromAppointment({
    required int appointmentId,
    required int customerId,
    required String customerName,
    required String customerAvatar,
    required int staffId,
    required String staffName,
    required String staffAvatar,
    required String appointmentStatus,
    String? serviceName, // Thêm tên dịch vụ
  }) async {
    final chatRoomId = 'chat_appointment_$appointmentId';
    
    // Kiểm tra đã tồn tại chưa
    final snapshot = await _database.child('chatRooms/$chatRoomId').get();
    
    if (snapshot.exists) {
      return ChatRoom.fromJson(
        chatRoomId,
        Map<String, dynamic>.from(snapshot.value as Map),
      );
    }
    
    // Tạo chat room mới
    final newChatRoom = ChatRoom(
      id: chatRoomId,
      customerId: customerId,
      customerName: customerName,
      customerAvatar: customerAvatar,
      staffId: staffId,
      staffName: staffName,
      staffAvatar: staffAvatar,
      createdAt: DateTime.now(),
      appointmentId: appointmentId,
      appointmentStatus: appointmentStatus,
      serviceName: serviceName, // Lưu tên dịch vụ
      isActive: appointmentStatus != 'Completed' && appointmentStatus != 'Cancelled',
    );
    
    await _database.child('chatRooms/$chatRoomId').set(newChatRoom.toJson());
    return newChatRoom;
  }

  // Cập nhật status chat room khi appointment thay đổi
  Future<void> updateChatRoomStatus({
    required int appointmentId,
    required String appointmentStatus,
  }) async {
    final chatRoomId = 'chat_appointment_$appointmentId';
    final isActive = appointmentStatus != 'Completed' && appointmentStatus != 'Cancelled';
    
    await _database.child('chatRooms/$chatRoomId').update({
      'appointmentStatus': appointmentStatus,
      'isActive': isActive,
    });
    
  }

  // Tạo hoặc lấy chat room giữa khách hàng và nhân viên (legacy - giữ lại cho tương thích)
  Future<ChatRoom> getOrCreateChatRoom({
    required int customerId,
    required String customerName,
    required String customerAvatar,
    required int staffId,
    required String staffName,
    required String staffAvatar,
  }) async {
    final chatRoomId = 'chat_${customerId}_$staffId';
    
    final snapshot = await _database.child('chatRooms/$chatRoomId').get();
    
    if (snapshot.exists) {
      return ChatRoom.fromJson(
        chatRoomId,
        Map<String, dynamic>.from(snapshot.value as Map),
      );
    } else {
      final newChatRoom = ChatRoom(
        id: chatRoomId,
        customerId: customerId,
        customerName: customerName,
        customerAvatar: customerAvatar,
        staffId: staffId,
        staffName: staffName,
        staffAvatar: staffAvatar,
        createdAt: DateTime.now(),
      );
      
      await _database.child('chatRooms/$chatRoomId').set(newChatRoom.toJson());
      return newChatRoom;
    }
  }

  // Gửi tin nhắn
  Future<void> sendMessage({
    required String chatRoomId,
    required String senderId,
    required String senderName,
    required String senderAvatar,
    required String message,
    String? imageUrl,
    MessageType type = MessageType.text,
    String? recipientId, // ID của người nhận để gửi notification
  }) async {
    final messageId = _database.child('messages/$chatRoomId').push().key!;
    
    final chatMessage = ChatMessage(
      id: messageId,
      chatRoomId: chatRoomId,
      senderId: senderId,
      senderName: senderName,
      senderAvatar: senderAvatar,
      message: message,
      imageUrl: imageUrl,
      timestamp: DateTime.now(),
      type: type,
    );

    // Lưu message
    await _database
        .child('messages/$chatRoomId/$messageId')
        .set(chatMessage.toJson());

    // Cập nhật last message trong chat room và tăng unread count
    
    // Lấy thông tin chat room hiện tại
    final roomSnapshot = await _database.child('chatRooms/$chatRoomId').get();
    int unreadCountStaff = 0;
    int unreadCountCustomer = 0;
    
    if (roomSnapshot.exists) {
      final roomData = Map<String, dynamic>.from(roomSnapshot.value as Map);
      final staffId = roomData['staffId'].toString();
      final customerId = roomData['customerId'].toString();
      
      // Lấy unread count hiện tại
      unreadCountStaff = (roomData['unreadCountStaff'] ?? 0) as int;
      unreadCountCustomer = (roomData['unreadCountCustomer'] ?? 0) as int;
      
      // Tăng unreadCount cho người NHẬN
      if (senderId == staffId) {
        // Staff gửi → tăng unreadCount cho customer
        unreadCountCustomer++;
      } else if (senderId == customerId) {
        // Customer gửi → tăng unreadCount cho staff
        unreadCountStaff++;
      }
    }
    
    await _database.child('chatRooms/$chatRoomId').update({
      'lastMessage': type == MessageType.image ? '📷 Hình ảnh' : message,
      'lastMessageTime': DateTime.now().millisecondsSinceEpoch,
      'unreadCountStaff': unreadCountStaff,
      'unreadCountCustomer': unreadCountCustomer,
      // Keep old field for backward compatibility
      'unreadCount': unreadCountStaff,
    });

    // Gửi notification đến người nhận (nếu có recipientId)
    // Chạy async không cần await để không block UI
    if (recipientId != null && recipientId.isNotEmpty) {
      // Fire and forget - không await
      _chatApiService.sendChatNotification(
        recipientUserId: recipientId,
        senderName: senderName,
        messageContent: type == MessageType.image ? '📷 Đã gửi một hình ảnh' : message,
        chatRoomId: chatRoomId,
        senderAvatar: senderAvatar,
      ).then((_) {
      }).catchError((e) {
      });
    }
    
  }

  // Lấy danh sách tin nhắn
  Stream<List<ChatMessage>> getMessages(String chatRoomId) {
    return _database
        .child('messages/$chatRoomId')
        .orderByChild('timestamp')
        .onValue
        .map((event) {
      final messages = <ChatMessage>[];
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        data.forEach((key, value) {
          messages.add(ChatMessage.fromJson(Map<String, dynamic>.from(value)));
        });
      }
      messages.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return messages;
    });
  }

  // Lấy danh sách chat rooms của khách hàng
  Stream<List<ChatRoom>> getCustomerChatRooms(int customerId) {
    return _database
        .child('chatRooms')
        .orderByChild('customerId')
        .equalTo(customerId)
        .onValue
        .map((event) {
      final chatRooms = <ChatRoom>[];
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        data.forEach((key, value) {
          chatRooms.add(
            ChatRoom.fromJson(key, Map<String, dynamic>.from(value)),
          );
        });
      }
      chatRooms.sort((a, b) {
        if (a.lastMessageTime == null) return 1;
        if (b.lastMessageTime == null) return -1;
        return b.lastMessageTime!.compareTo(a.lastMessageTime!);
      });
      return chatRooms;
    });
  }

  // Lấy danh sách chat rooms của nhân viên
  Stream<List<ChatRoom>> getStaffChatRooms(int staffId) {
    return _database
        .child('chatRooms')
        .onValue
        .map((event) {
      final chatRooms = <ChatRoom>[];
      
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        
        data.forEach((key, value) {
          final room = ChatRoom.fromJson(key, Map<String, dynamic>.from(value));
          
          // Filter by staffId client-side
          if (room.staffId == staffId) {
            chatRooms.add(room);
          }
        });
      }
      
      
      chatRooms.sort((a, b) {
        if (a.lastMessageTime == null) return 1;
        if (b.lastMessageTime == null) return -1;
        return b.lastMessageTime!.compareTo(a.lastMessageTime!);
      });
      return chatRooms;
    });
  }

  // Upload ảnh
  Future<String?> uploadImage(File imageFile, String chatRoomId) async {
    try {
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
      final ref = _storage.ref().child('chat_images/$chatRoomId/$fileName');
      
      await ref.putFile(imageFile);
      final downloadUrl = await ref.getDownloadURL();
      
      return downloadUrl;
    } catch (e) {
      return null;
    }
  }

  // Đánh dấu tin nhắn đã đọc
  Future<void> markMessagesAsRead(String chatRoomId, String userId) async {
    
    final snapshot = await _database.child('messages/$chatRoomId').get();
    
    if (snapshot.exists) {
      final data = Map<String, dynamic>.from(snapshot.value as Map);
      int markedCount = 0;
      
      data.forEach((key, value) async {
        final message = Map<String, dynamic>.from(value);
        if (message['senderId'] != userId && !(message['isRead'] ?? false)) {
          await _database
              .child('messages/$chatRoomId/$key')
              .update({'isRead': true});
          markedCount++;
        }
      });
      
      
      // Reset unreadCount về 0 khi đã đọc - cần xác định ai đang đọc
      if (markedCount > 0) {
        final roomSnapshot = await _database.child('chatRooms/$chatRoomId').get();
        if (roomSnapshot.exists) {
          final roomData = Map<String, dynamic>.from(roomSnapshot.value as Map);
          final staffId = roomData['staffId'].toString();
          
          // Reset đúng field dựa vào ai đang đọc
          if (userId == staffId) {
            // Staff đang đọc → reset unreadCountStaff
            await _database.child('chatRooms/$chatRoomId').update({
              'unreadCountStaff': 0,
              'unreadCount': 0, // backward compatibility
            });
          } else {
            // Customer đang đọc → reset unreadCountCustomer
            await _database.child('chatRooms/$chatRoomId').update({
              'unreadCountCustomer': 0,
            });
          }
        }
      }
    }
  }
  
  // Reset unread count cho staff khi vào chat room
  Future<void> resetUnreadCountForStaff(String chatRoomId) async {
    await _database.child('chatRooms/$chatRoomId').update({
      'unreadCountStaff': 0,
      'unreadCount': 0, // backward compatibility
    });
  }
}
