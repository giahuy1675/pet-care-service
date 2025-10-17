# Trang Chi Tiết Dịch Vụ (Service Detail Page)

## 📱 Tổng quan

Trang **Service Detail Page** là trang giới thiệu chi tiết về dịch vụ chăm sóc thú cưng với đầy đủ thông tin giúp khách hàng hiểu rõ về dịch vụ trước khi đặt lịch.

## ✨ Tính năng chính

### 1. **Header (Phần đầu trang)**
- Logo & tên dịch vụ
- Nút Share (Chia sẻ)
- Nút Favorite (Yêu thích)
- AppBar có thể thu nhỏ khi scroll

### 2. **Slider Ảnh**
- Carousel slider tự động chuyển ảnh
- Hiển thị slogan: "🐾 Đẹp trai – Sạch sẽ – Khỏe mạnh!"
- Overlay gradient đẹp mắt
- Chỉ báo (indicators) cho các slide

### 3. **Quick Actions**
- Nút **Gọi ngay**: Gọi điện trực tiếp đến hotline
- Nút **Đặt lịch**: Chuyển đến trang đặt lịch

### 4. **Tab Navigation**
Gồm 5 tabs chính:

#### 📋 **Tab 1: Giới thiệu**
- Thông tin về sứ mệnh, tầm nhìn
- Các điểm nổi bật:
  - 👨‍⚕️ Đội ngũ chuyên nghiệp
  - 🛡️ Sản phẩm an toàn
  - 🏆 Kinh nghiệm lâu năm
  - ❤️ Chăm sóc tận tâm

#### 🔄 **Tab 2: Trước/Sau (Before/After)**
- Hình ảnh trước và sau khi sử dụng dịch vụ
- So sánh trực quan với thiết kế chia đôi
- Mô tả cho mỗi case study

#### ⭐ **Tab 3: Đánh giá**
- Điểm trung bình (rating) với hiển thị nổi bật
- Danh sách reviews từ khách hàng:
  - Avatar
  - Tên khách hàng
  - Số sao đánh giá
  - Ngày đánh giá
  - Nội dung review

#### 💰 **Tab 4: Bảng giá**
3 gói dịch vụ:

**Gói Cơ Bản (200,000₫)**
- Tắm rửa sạch sẽ
- Cắt móng
- Vệ sinh tai
- Chải lông cơ bản

**Gói Nâng Cao (350,000₫)** - PHỔ BIẾN NHẤT 🔥
- Tất cả dịch vụ cơ bản
- Cắt tỉa lông theo yêu cầu
- Massage thư giãn
- Vệ sinh răng miệng
- Dưỡng lông chuyên sâu

**Gói VIP (500,000₫)**
- Tất cả dịch vụ nâng cao
- Spa cao cấp
- Tạo kiểu lông nghệ thuật
- Nhuộm lông an toàn
- Chăm sóc da đặc biệt
- Tặng sản phẩm chăm sóc

#### 📍 **Tab 5: Liên hệ**
- Thông tin liên hệ đầy đủ:
  - 📍 Địa chỉ
  - 📞 Hotline
  - 📧 Email
  - 🕐 Giờ làm việc
- Các nút social media:
  - Facebook
  - Instagram
  - YouTube
  - TikTok
- Bản đồ Google Maps với nút "Chỉ đường"

### 5. **Bottom Bar - CTA**
- Hiển thị giá dịch vụ
- Nút "Đặt lịch ngay" nổi bật

## 🎨 Thiết kế UI/UX

### Màu sắc
- Primary color: Theme của app
- Accent colors cho từng gói dịch vụ:
  - Cơ bản: Blue
  - Nâng cao: Orange (Popular)
  - VIP: Purple

### Animation
- Fade in animation cho cards
- Smooth scroll
- Tab transition mượt mà
- Carousel auto-play

### Icons
Sử dụng Font Awesome Icons:
- `paw` - Dấu chân thú cưng
- `phone` - Điện thoại
- `calendar-check` - Lịch hẹn
- `circle-info` - Thông tin
- `star` - Đánh giá
- `location-dot` - Địa chỉ
- Và nhiều icon khác...

## 📱 Cách sử dụng

### 1. Từ Enhanced Services Page

Trên mỗi service card, có 2 nút:
```dart
Row(
  children: [
    // Nút "Chi tiết"
    OutlinedButton.icon(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ServiceDetailPage(service: service),
          ),
        );
      },
      icon: Icon(Icons.info),
      label: Text('Chi tiết'),
    ),
    
    // Nút "Đặt ngay"
    ElevatedButton.icon(...),
  ],
)
```

### 2. Truyền dữ liệu service

```dart
final service = {
  'serviceId': 1,
  'name': 'Tắm và cắt tỉa lông',
  'description': 'Dịch vụ chăm sóc toàn diện...',
  'price': 250000,
  'duration': 60,
  'category': 'Grooming',
  'photo': 'https://...',
  'rating': 4.8,
  'reviewCount': 120,
  'bookingCount': 450,
};

Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ServiceDetailPage(service: service),
  ),
);
```

## 🔧 Dependencies

File `pubspec.yaml` cần có:

```yaml
dependencies:
  flutter:
    sdk: flutter
  font_awesome_flutter: ^10.7.0
  intl: ^0.19.0
  carousel_slider: ^5.1.1
  url_launcher: ^6.3.1  # Mới thêm
```

Chạy lệnh:
```bash
flutter pub get
```

## 📂 File Structure

```
lib/
  pages/
    ├── enhanced_services_page.dart    # Trang danh sách dịch vụ
    └── service_detail_page.dart       # Trang chi tiết dịch vụ (MỚI)
```

## 🎯 Tính năng tương tác

### 1. Gọi điện
```dart
final Uri phoneUri = Uri(scheme: 'tel', path: '1900123456');
if (await canLaunchUrl(phoneUri)) {
  await launchUrl(phoneUri);
}
```

### 2. Gửi email
```dart
final Uri emailUri = Uri(
  scheme: 'mailto',
  path: 'info@petsalon.vn',
);
if (await canLaunchUrl(emailUri)) {
  await launchUrl(emailUri);
}
```

### 3. Mở Google Maps
```dart
final Uri mapsUri = Uri.parse(
  'https://www.google.com/maps/search/?api=1&query=10.762622,106.660172',
);
if (await canLaunchUrl(mapsUri)) {
  await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
}
```

## 🎨 Customization

### 1. Thay đổi slider images

Trong `_ServiceDetailPageState`:
```dart
final List<String> _sliderImages = [
  'YOUR_IMAGE_URL_1',
  'YOUR_IMAGE_URL_2',
  'YOUR_IMAGE_URL_3',
];
```

### 2. Cập nhật pricing packages

```dart
final List<Map<String, dynamic>> _pricingPackages = [
  {
    'name': 'TÊN GÓI',
    'price': 200000,
    'features': ['Tính năng 1', 'Tính năng 2'],
    'color': Colors.blue,
    'popular': true, // Đánh dấu gói phổ biến
  },
  // ...
];
```

### 3. Thêm reviews

```dart
final List<Map<String, dynamic>> _reviews = [
  {
    'name': 'Tên khách hàng',
    'avatar': 'URL_AVATAR',
    'rating': 5.0,
    'date': '2025-10-10',
    'comment': 'Nội dung đánh giá...',
  },
  // ...
];
```

## 📊 Data Flow

```
Enhanced Services Page
    ↓ (User taps "Chi tiết")
Service Detail Page
    ↓ (Receives service data)
Display 5 tabs:
    1. Introduction
    2. Before/After
    3. Reviews
    4. Pricing
    5. Contact
    ↓ (User taps "Đặt lịch")
Appointment Booking Page
```

## 🚀 Features Roadmap

- [ ] Tích hợp API thực để lấy reviews
- [ ] Tích hợp API để lấy before/after images
- [ ] Thêm chức năng yêu thích (favorite)
- [ ] Thêm chức năng chia sẻ (share)
- [ ] Tích hợp Google Maps thật
- [ ] Thêm video giới thiệu dịch vụ
- [ ] Live chat support
- [ ] Đánh giá trực tiếp từ app
- [ ] So sánh nhiều gói dịch vụ

## 📸 Screenshots

### Tab Giới thiệu
- Header với slider
- Quick actions
- Các điểm nổi bật

### Tab Before/After
- So sánh hình ảnh
- Case studies

### Tab Đánh giá
- Rating overview
- Customer reviews

### Tab Bảng giá
- 3 pricing tiers
- Feature comparison

### Tab Liên hệ
- Contact info
- Social media
- Map integration

## 💡 Tips

1. **Custom theme**: Thay đổi màu sắc theo brand của bạn
2. **Dynamic data**: Kết nối với API để lấy dữ liệu thực
3. **Localization**: Hỗ trợ đa ngôn ngữ
4. **Analytics**: Theo dõi hành vi người dùng
5. **A/B Testing**: Test các layouts khác nhau

## 🐛 Troubleshooting

### Lỗi url_launcher
```bash
flutter pub add url_launcher
flutter pub get
```

### Lỗi carousel_slider
```bash
flutter pub add carousel_slider
flutter pub get
```

### Lỗi build
```bash
flutter clean
flutter pub get
flutter run
```

## 📞 Support

Nếu có vấn đề, vui lòng liên hệ team phát triển.

---

**Happy Coding! 🐾**
