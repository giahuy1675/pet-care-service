# Hướng Dẫn Tích Hợp Google Maps - Chọn Cửa Hàng

## 📋 Tổng Quan

Đã tích hợp thành công tính năng Google Maps vào trang chi tiết lịch hẹn, cho phép khách hàng:
- ✅ Xem vị trí hiện tại của mình
- ✅ Xem danh sách các cửa hàng trên bản đồ
- ✅ Chọn cửa hàng gần nhất
- ✅ Xem khoảng cách đến từng cửa hàng
- ✅ Nhận chỉ đường đến cửa hàng (sử dụng OSRM - miễn phí 100%)

## 🎯 Các File Đã Tạo/Cập Nhật

### 1. **lib/models/store.dart** (MỚI)
Model quản lý thông tin cửa hàng với tọa độ GPS:
```dart
class Store {
  final String id;
  final String name;
  final String address;
  final LatLng location;
  double? distance;
  final String? phone;
  final String? openHours;
}
```

### 2. **lib/widgets/store_map_picker.dart** (MỚI)
Widget hiển thị bản đồ để chọn cửa hàng với đầy đủ tính năng:
- Hiển thị vị trí hiện tại
- Markers cho tất cả cửa hàng
- Tính khoảng cách tự động
- Chỉ đường sử dụng OSRM (miễn phí)
- Danh sách cửa hàng sắp xếp theo khoảng cách

### 3. **lib/pages/appointment_detail_page.dart** (CẬP NHẬT)
Đã thêm:
- Import `Store` model và `StoreMapPicker` widget
- Biến `_selectedStore` để lưu cửa hàng được chọn
- Nút chọn cửa hàng trên bản đồ
- Hiển thị thông tin cửa hàng đã chọn (tên, địa chỉ, khoảng cách)

### 4. **android/app/src/main/AndroidManifest.xml** (CẬP NHẬT)
Đã thêm:
- Quyền truy cập vị trí: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- Quyền INTERNET
- Google Maps API Key: `AIzaSyC_FqvXr-AB6iiijNHV-JQfcLK_SypV5II`

### 5. **pubspec.yaml** (CẬP NHẬT)
Đã thêm dependencies:
```yaml
google_maps_flutter: ^2.9.0
geolocator: ^12.0.0
geocoding: ^3.0.0
flutter_polyline_points: ^2.1.0
```

## 🗺️ Cách Sử Dụng

### Trong Trang Chi Tiết Lịch Hẹn:
1. Người dùng vào trang chi tiết lịch hẹn
2. Trong phần "Thời gian & Địa điểm", nhấn vào icon bản đồ 📍
3. Màn hình Google Maps mở ra, hiển thị:
   - Vị trí hiện tại của người dùng (chấm xanh)
   - Các cửa hàng (chấm cam)
4. Người dùng có thể:
   - Nhấn vào marker cửa hàng để xem thông tin
   - Nhấn "Danh sách cửa hàng" để xem tất cả (sắp xếp theo khoảng cách)
   - Nhấn "Chỉ đường" để xem đường đi
   - Nhấn "Chọn cửa hàng" để xác nhận
5. Sau khi chọn, thông tin cửa hàng hiển thị trong lịch hẹn

## 📍 Danh Sách Cửa Hàng Mặc Định

Hiện tại có 3 cửa hàng mẫu trong `store_map_picker.dart`:

| ID | Tên | Tọa Độ |
|----|-----|--------|
| 1 | Cửa hàng 1 - Chi nhánh Thủ Đức | 10.8507, 106.7719 |
| 2 | Cơ sở 2 - Chi nhánh Bình Dương | 11.1306, 106.6134 |
| 3 | Cơ sở 3 - Chi nhánh Quận 9 | 10.8713, 106.8030 |

### 🔧 Cách Thay Đổi Danh Sách Cửa Hàng:

**Option 1: Chỉnh sửa trực tiếp trong `store_map_picker.dart`**
```dart
_stores = widget.customStores ?? [
  Store(
    id: '1',
    name: 'Tên cửa hàng của bạn',
    address: 'Địa chỉ của bạn',
    location: const LatLng(10.850, 106.771), // Thay tọa độ
    phone: '0901234567',
    openHours: '8:00 - 21:30',
  ),
  // Thêm cửa hàng khác...
];
```

**Option 2: Truyền danh sách tùy chỉnh từ API**
```dart
// Trong appointment_detail_page.dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => StoreMapPicker(
      customStores: await _loadStoresFromAPI(), // Lấy từ API
      onStoreSelected: (store) {
        // ...
      },
    ),
  ),
);
```

## 🆓 Routing API - OSRM (Miễn Phí)

Dự án sử dụng **OSRM (Open Source Routing Machine)** để tìm đường:
- ✅ **Miễn phí 100%**
- ✅ Không cần API key
- ✅ Không cần billing
- ✅ Dữ liệu từ OpenStreetMap
- ✅ Tính toán khoảng cách và thời gian

Nếu OSRM lỗi, hệ thống tự động vẽ đường thẳng nét đứt.

## 🔐 Google Maps API Key

API Key hiện tại: `AIzaSyC_FqvXr-AB6iiijNHV-JQfcLK_SypV5II`

⚠️ **Lưu ý**: Đây là API key từ project mẫu. Trong production, bạn nên:
1. Tạo API key riêng tại [Google Cloud Console](https://console.cloud.google.com/)
2. Bật các API sau:
   - Maps SDK for Android
   - Geocoding API
3. Thay thế trong:
   - `android/app/src/main/AndroidManifest.xml`
   - `lib/widgets/store_map_picker.dart` (biến `_googleApiKey`)

## 📱 Testing

### Trên Emulator:
```bash
flutter run
```
- Emulator sẽ dùng vị trí mặc định tại Việt Nam
- Có thể set vị trí giả trong emulator settings

### Trên Thiết Bị Thật:
```bash
flutter run -d <device-id>
```
- Cần cấp quyền vị trí cho app
- GPS phải được bật

## 🐛 Xử Lý Lỗi

### Lỗi phổ biến:

1. **"Không có quyền truy cập vị trí"**
   - Giải pháp: Cấp quyền vị trí trong Settings > Apps > Pet Flutter > Permissions

2. **"Dịch vụ vị trí đang tắt"**
   - Giải pháp: Bật GPS trong Settings

3. **"OSRM lỗi"**
   - Tự động fallback sang đường thẳng
   - Kiểm tra kết nối internet

## 📊 Tính Năng Nổi Bật

### 1. Tính Khoảng Cách Tự Động
- Sử dụng `Geolocator.distanceBetween()`
- Chuyển đổi từ mét sang km
- Hiển thị 2 chữ số thập phân

### 2. Sắp Xếp Cửa Hàng
- Danh sách tự động sắp xếp theo khoảng cách
- Cửa hàng gần nhất ở đầu danh sách

### 3. Chỉ Đường Thông Minh
- Ưu tiên OSRM (miễn phí)
- Hiển thị thời gian và khoảng cách dự kiến
- Vẽ polyline màu xanh dương

### 4. UI/UX Thân Thiện
- Snackbar thông báo rõ ràng
- Bottom sheet hiển thị thông tin cửa hàng
- Card khoảng cách với màu sắc nổi bật
- Icon trực quan

## 🚀 Tính Năng Mở Rộng (Tương Lai)

### 1. Lưu Cửa Hàng Đã Chọn
```dart
// Lưu vào SharedPreferences
await prefs.setString('selected_store_id', store.id);
```

### 2. Lấy Danh Sách Từ API
```dart
Future<List<Store>> _loadStoresFromAPI() async {
  final response = await http.get(Uri.parse('$baseUrl/api/stores'));
  // Parse và return List<Store>
}
```

### 3. Lọc Cửa Hàng Theo Dịch Vụ
```dart
List<Store> getStoresByService(String serviceId) {
  // Lọc cửa hàng hỗ trợ dịch vụ cụ thể
}
```

### 4. Thêm Giờ Mở Cửa
```dart
bool isStoreOpen(Store store) {
  // Kiểm tra giờ hoạt động
}
```

## 📝 Checklist Hoàn Thành

- [x] Thêm dependencies Google Maps
- [x] Tạo model Store
- [x] Tạo widget StoreMapPicker
- [x] Tích hợp vào AppointmentDetailPage
- [x] Cập nhật AndroidManifest.xml
- [x] Chạy flutter pub get thành công
- [x] Test cơ bản

## 🎉 Kết Quả

Bây giờ khách hàng có thể:
1. ✅ Xem vị trí của mình trên bản đồ
2. ✅ Xem tất cả cửa hàng xung quanh
3. ✅ Biết khoảng cách đến từng cửa hàng
4. ✅ Nhận chỉ đường đến cửa hàng
5. ✅ Chọn cửa hàng phù hợp nhất cho lịch hẹn

---

**Ngày tích hợp**: 15/10/2025
**Người thực hiện**: GitHub Copilot
**Trạng thái**: ✅ Hoàn thành
