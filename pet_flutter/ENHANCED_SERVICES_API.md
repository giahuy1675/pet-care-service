# Enhanced Services API Documentation

## Tổng quan
API đã được cập nhật để hỗ trợ các tính năng nâng cao cho trang dịch vụ, bao gồm đánh giá, bộ lọc và sắp xếp.

## Các thay đổi chính

### 1. ServiceDto mở rộng
```csharp
public class ServiceDto
{
    // Các trường cũ
    public int ServiceId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int Duration { get; set; }
    public string Category { get; set; }
    public string Photo { get; set; }
    public bool? IsActive { get; set; }
    
    // Các trường mới
    public double Rating { get; set; } = 0;           // Đánh giá trung bình
    public int ReviewCount { get; set; } = 0;         // Số lượng đánh giá
    public int BookingCount { get; set; } = 0;        // Số lượng đặt lịch
    public DateTime? CreatedAt { get; set; }          // Ngày tạo
    public DateTime? UpdatedAt { get; set; }          // Ngày cập nhật
}
```

### 2. API Endpoints mới

#### GET /api/Services/filtered
Lấy danh sách dịch vụ với bộ lọc và sắp xếp nâng cao.

**Query Parameters:**
- `category` (string, optional): Lọc theo danh mục (Grooming, Medical, Hotel, Food)
- `minPrice` (decimal, optional): Giá tối thiểu
- `maxPrice` (decimal, optional): Giá tối đa
- `duration` (int, optional): Thời gian thực hiện (phút)
- `sortBy` (string, optional): Sắp xếp theo (popular, rating, price_low, price_high)

**Ví dụ:**
```
GET /api/Services/filtered?category=Grooming&minPrice=100000&maxPrice=500000&duration=60&sortBy=rating
```

**Response:**
```json
[
  {
    "serviceId": 1,
    "name": "Cắt tỉa lông",
    "description": "Cắt tỉa lông chuyên nghiệp",
    "price": 200000,
    "duration": 60,
    "category": "Grooming",
    "photo": "https://example.com/photo.jpg",
    "isActive": true,
    "rating": 4.5,
    "reviewCount": 12,
    "bookingCount": 45,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Cập nhật ServiceService

#### GetAllServicesAsync()
- Tự động tính toán rating, reviewCount, bookingCount
- Bao gồm thông tin CreatedAt, UpdatedAt

#### GetServiceByIdAsync(int id)
- Tương tự GetAllServicesAsync() nhưng cho một dịch vụ cụ thể

#### GetServicesByCategoryAsync(string category)
- Tương tự GetAllServicesAsync() nhưng lọc theo danh mục

#### GetFilteredServicesAsync() - MỚI
- Hỗ trợ bộ lọc theo category, price range, duration
- Hỗ trợ sắp xếp theo popular, rating, price
- Tự động tính toán rating và booking count

### 4. Flutter Service cập nhật

#### ServiceService.getFilteredServices()
```dart
Future<List<Map<String, dynamic>>> getFilteredServices({
  String? category,
  double? minPrice,
  double? maxPrice,
  int? duration,
  String sortBy = 'popular',
}) async
```

## Cách sử dụng

### Backend
1. Cập nhật database schema (nếu cần)
2. Build và chạy API
3. Các endpoint mới sẽ tự động có sẵn

### Frontend (Flutter)
1. EnhancedServicesPage tự động sử dụng API mới
2. Bộ lọc và sắp xếp được xử lý bởi backend
3. Dữ liệu rating và booking count được tính toán tự động

## Lợi ích

1. **Performance**: Bộ lọc và sắp xếp được xử lý ở backend
2. **Accuracy**: Rating và booking count được tính toán chính xác từ database
3. **Scalability**: Có thể dễ dàng thêm các bộ lọc mới
4. **Consistency**: Dữ liệu luôn được đồng bộ với database

## Tương lai

- Có thể thêm bộ lọc theo khoảng thời gian
- Có thể thêm bộ lọc theo địa điểm
- Có thể thêm pagination cho danh sách dịch vụ
- Có thể thêm search API để tìm kiếm nâng cao
