import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class ApiConfig {
  // Allow override via --dart-define=API_BASE_URL=https://myhost:port
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;
    if (kIsWeb) return 'https://localhost:7164';
    // On Android emulator use HTTP port to avoid SSL handshake issues with dev cert
    if (Platform.isAndroid) return 'http://10.0.2.2:5181';
    return 'https://localhost:7164';
  }
}


