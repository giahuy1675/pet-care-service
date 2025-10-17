# 🚀 Quick Start - Google Maps Integration

## ⚡ Cách Sử Dụng Nhanh

### Bước 1: Vào Trang Chi Tiết Lịch Hẹn
```
Trang chủ > Lịch hẹn > Chọn một lịch hẹn > Chi tiết
```

### Bước 2: Tìm Phần "Thời gian & Địa điểm"
Scroll xuống phần có icon 🗓️ (Thời gian & Địa điểm)

### Bước 3: Nhấn Icon Bản Đồ
Nhấn vào icon 📍 màu xanh lá bên phải

### Bước 4: Chọn Cửa Hàng
Bạn sẽ thấy màn hình bản đồ với:
- **Chấm xanh dương**: Vị trí của bạn
- **Chấm cam**: Các cửa hàng

**3 cách chọn cửa hàng:**

#### Cách 1: Nhấn Trực Tiếp Vào Marker
```
1. Nhấn vào chấm cam (cửa hàng)
2. Bottom sheet hiện lên với thông tin
3. Nhấn "Chọn cửa hàng" màu xanh lá
```

#### Cách 2: Xem Danh Sách
```
1. Nhấn icon "≡" ở góc trên phải
2. Xem danh sách cửa hàng (đã sắp xếp theo khoảng cách)
3. Chọn cửa hàng muốn đến
```

#### Cách 3: Nhận Chỉ Đường Trước
```
1. Nhấn vào chấm cam (cửa hàng)
2. Nhấn "Chỉ đường" để xem đường đi
3. Nếu OK, nhấn "Chọn cửa hàng"
```

### Bước 5: Xác Nhận
Sau khi chọn, thông tin cửa hàng sẽ hiển thị trong lịch hẹn:
- ✅ Tên cửa hàng
- ✅ Địa chỉ
- ✅ Số điện thoại
- ✅ Khoảng cách (km)

## 🎨 Giao Diện

### Màn Hình Chọn Cửa Hàng
```
┌─────────────────────────────────────┐
│  ← Chọn cửa hàng    📍 ≡           │
├─────────────────────────────────────┤
│                                     │
│        🗺️  GOOGLE MAP               │
│                                     │
│     🔵 Vị trí của bạn              │
│                                     │
│     🟠 Cửa hàng 1                  │
│     🟠 Cửa hàng 2                  │
│     🟠 Cửa hàng 3                  │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │ 📍 Địa chỉ hiện tại:          │ │
│  │ 123 Đường ABC, Quận X...      │ │
│  │ Tọa độ: 10.8562, 106.7856    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Bottom Sheet Thông Tin Cửa Hàng
```
┌─────────────────────────────────────┐
│  🏪 Cửa hàng 1 - Chi nhánh Thủ Đức │
│                                  ✕  │
├─────────────────────────────────────┤
│  📍 Địa chỉ cửa hàng 1             │
│  📞 0901234567                      │
│  🕐 8:00 - 21:30                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🚶 Khoảng cách                │ │
│  │    2.35 km                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ 🧭 Chỉ đường ]  [ ✓ Chọn cửa hàng ] │
└─────────────────────────────────────┘
```

### Danh Sách Cửa Hàng
```
┌─────────────────────────────────────┐
│  🏪 Danh sách cửa hàng          ✕  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │ 1  Cửa hàng 1 - Chi nhánh..  │ │
│  │    Địa chỉ cửa hàng 1        │ │
│  │    🚶 2.35 km              › │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ 2  Cơ sở 2 - Chi nhánh...    │ │
│  │    Địa chỉ cơ sở 2           │ │
│  │    🚶 5.67 km              › │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ 3  Cơ sở 3 - Chi nhánh...    │ │
│  │    Địa chỉ cơ sở 3           │ │
│  │    🚶 8.92 km              › │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔧 Tùy Chỉnh Danh Sách Cửa Hàng

### File: `lib/widgets/store_map_picker.dart`

Tìm dòng ~53 và sửa:

```dart
_stores = widget.customStores ?? [
  Store(
    id: '1',
    name: 'TÊN CỬA HÀNG CỦA BẠN',           // 👈 Sửa tên
    address: 'ĐỊA CHỈ CỦA BẠN',            // 👈 Sửa địa chỉ
    location: const LatLng(10.850, 106.771), // 👈 Sửa tọa độ
    phone: '0901234567',                    // 👈 Sửa SĐT
    openHours: '8:00 - 21:30',             // 👈 Sửa giờ
  ),
  // Thêm cửa hàng khác...
];
```

### 🗺️ Cách Lấy Tọa Độ GPS:

**Cách 1: Google Maps Web**
```
1. Mở https://maps.google.com
2. Nhấn chuột phải vào địa điểm
3. Nhấn "What's here?"
4. Copy tọa độ (vd: 10.850748, 106.771924)
```

**Cách 2: Google Maps Mobile**
```
1. Mở app Google Maps
2. Nhấn giữ vào địa điểm
3. Kéo lên bottom sheet
4. Copy tọa độ
```

**Cách 3: Sử dụng GPS Phone**
```
1. Đứng tại cửa hàng
2. Mở app "GPS Status" hoặc tương tự
3. Ghi lại tọa độ Latitude, Longitude
```

## 📞 Support

### Lỗi Thường Gặp:

**1. "Không có quyền truy cập vị trí"**
```
Settings > Apps > Pet Flutter > Permissions > Location > Allow
```

**2. "Không hiển thị vị trí hiện tại"**
```
- Bật GPS/Location Services
- Kiểm tra quyền app
- Restart app
```

**3. "Không tìm được đường đi"**
```
- Kiểm tra internet
- OSRM có thể tạm thời lỗi
- Hệ thống tự động vẽ đường thẳng
```

**4. "API key không hoạt động"**
```
- Tạo API key mới tại Google Cloud Console
- Bật Maps SDK for Android
- Thay trong AndroidManifest.xml
```

## ✅ Checklist Test

- [ ] Mở màn hình chọn cửa hàng
- [ ] Xem vị trí hiện tại (chấm xanh)
- [ ] Xem các cửa hàng (chấm cam)
- [ ] Nhấn vào marker cửa hàng
- [ ] Xem danh sách cửa hàng
- [ ] Nhấn "Chỉ đường"
- [ ] Xem đường đi màu xanh
- [ ] Nhấn "Chọn cửa hàng"
- [ ] Quay lại trang lịch hẹn
- [ ] Kiểm tra thông tin cửa hàng đã chọn

## 🎯 Mẹo Sử Dụng

1. **Cửa hàng gần nhất**: Nhấn icon "≡" để xem danh sách đã sắp xếp

2. **So sánh khoảng cách**: Nhấn vào từng cửa hàng để xem khoảng cách

3. **Xem đường đi trước**: Dùng "Chỉ đường" để biết đường đi có thuận tiện không

4. **Làm mới vị trí**: Nhấn icon 📍 góc trên phải để cập nhật vị trí

5. **Xóa đường đi**: Nhấn nút "Xóa đường đi" màu đỏ để xóa

---

**Happy Mapping! 🗺️✨**
