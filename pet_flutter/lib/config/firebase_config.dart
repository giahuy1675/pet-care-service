import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseConfig {
  static Future<void> initialize() async {
    // Kiểm tra nếu Firebase đã được khởi tạo chưa
    try {
      await Firebase.initializeApp();
      
      // Login Firebase Auth anonymous để có quyền truy cập Realtime Database
      if (FirebaseAuth.instance.currentUser == null) {
        await FirebaseAuth.instance.signInAnonymously();

      }
    } catch (e) {
      // Nếu đã khởi tạo rồi thì bỏ qua
      if (e.toString().contains('duplicate-app')) {

      } else {
        rethrow;
      }
    }
  }
}
