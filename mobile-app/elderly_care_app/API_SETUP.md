# API Configuration Setup

## 🔐 Cấu hình API Keys

Ứng dụng này sử dụng OpenRouter AI API để cung cấp tính năng tư vấn sức khỏe thông minh.

### Bước 1: Lấy API Key

1. Truy cập: https://openrouter.ai/keys
2. Đăng ký/Đăng nhập tài khoản
3. Tạo API key mới (miễn phí)
4. Copy API key

### Bước 2: Cấu hình trong dự án

1. Mở file: `lib/config/api_config.example.dart`
2. Copy thành file mới: `lib/config/api_config.dart`
3. Thay thế `YOUR_OPENROUTER_API_KEY_HERE` bằng API key thực của bạn

```dart
class ApiConfig {
  static const String openRouterApiKey = 'sk-or-v1-xxxxxxxxxxxxx'; // Thay bằng key của bạn
  // ... các config khác
}
```

### Bước 3: Chạy ứng dụng

```bash
flutter pub get
flutter run
```

## ⚠️ Lưu ý Bảo mật

- **KHÔNG BAO GIỜ** commit file `api_config.dart` lên Git
- File này đã được thêm vào `.gitignore`
- Chỉ commit file `api_config.example.dart`
- Mỗi developer cần tạo `api_config.dart` riêng trên máy local

## 🆓 Model AI Miễn phí

Dự án sử dụng model miễn phí: `liquid/lfm-2.5-1.2b-instruct:free`

Bạn có thể thay đổi model trong `api_config.dart` nếu muốn sử dụng model khác.

## 📚 Tài liệu tham khảo

- OpenRouter Documentation: https://openrouter.ai/docs
- Danh sách models: https://openrouter.ai/models
