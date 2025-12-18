# Firebase Database Rules - Presence Fix

## Lỗi Hiện Tại
```
Firebase Database error: Permission denied
setValue at /presence/1003 failed
```

## Nguyên Nhân
App đang cố gắng ghi trạng thái online của user vào Firebase Realtime Database nhưng bị từ chối do rules chưa đúng.

## Giải Pháp

### Bước 1: Vào Firebase Console
1. Truy cập: https://console.firebase.google.com
2. Chọn project của bạn
3. Vào **Realtime Database** (menu bên trái)
4. Click tab **Rules**

### Bước 2: Cập Nhật Rules

Thay thế rules hiện tại bằng:

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && (auth.uid == $uid || auth.token.userId == $uid)"
      }
    },
    "chats": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid == $uid || auth.token.userId == $uid)"
      }
    },
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

**Hoặc đơn giản hơn (cho development):**

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Bước 3: Publish Rules
1. Click **Publish** để áp dụng rules mới
2. Đợi vài giây để rules được cập nhật

### Bước 4: Test Lại
1. Hot restart app
2. Đăng nhập lại
3. Lỗi sẽ biến mất ✅

## Lưu Ý Bảo Mật

### Rules Hiện Tại (Đơn Giản - Development)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
- ✅ **Ưu điểm**: Đơn giản, dễ test
- ⚠️ **Nhược điểm**: Cho phép mọi user đã đăng nhập đọc/ghi mọi thứ

### Rules Nên Dùng (Production)
```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && (auth.uid == $uid || auth.token.userId == $uid)"
      }
    },
    "chats": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid == $uid || auth.token.userId == $uid)"
      }
    }
  }
}
```
- ✅ **Ưu điểm**: Bảo mật tốt, user chỉ ghi được data của mình
- ✅ **Phù hợp**: Production app

## Kiểm Tra Lỗi Đã Fix

Sau khi cập nhật rules, log sẽ không còn dòng này:
```
❌ W/RepoOperation: setValue at /presence/1003 failed: DatabaseError: Permission denied
```

Thay vào đó sẽ thấy:
```
✅ I/flutter: User presence updated successfully
```

## Tóm Tắt

1. **Vào Firebase Console** → Realtime Database → Rules
2. **Cập nhật rules** để cho phép user ghi presence
3. **Publish** rules
4. **Hot restart** app
5. ✅ **Done!**

---

**Lưu ý**: Lỗi này **KHÔNG LIÊN QUAN** đến tính năng đăng nhập vân tay. Đăng nhập vân tay vẫn hoạt động bình thường, chỉ là sau khi đăng nhập, app không cập nhật được presence do lỗi permission Firebase.
