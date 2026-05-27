# 🚀 HƯỚNG DẪN CHẠY APP Ở CHẾ ĐỘ DEVELOPMENT

## ✅ ĐÃ SẴN SÀNG
- ✅ Flutter 3.44.0 đã cài đặt
- ✅ Điện thoại Samsung A146P (Android 15) đã kết nối
- ✅ Dependencies đã được cài đặt
- ✅ API endpoint đã được cấu hình: `http://192.168.1.6:5041`

---

## 📋 BƯỚC 1: KHỞI ĐỘNG BACKEND SERVICES

**Mở PowerShell/Terminal mới** và chạy:

```powershell
cd d:\DAKT
.\start.ps1
```

Hoặc khởi động thủ công từng service nếu cần.

**Đảm bảo các services đang chạy:**
- ✅ ApiGateway: http://localhost:5041
- ✅ AuthService: http://localhost:5004
- ✅ NotificationService: http://localhost:5006
- ✅ ReminderService: http://localhost:5005
- ✅ Các services khác...

---

## 📱 BƯỚC 2: CHẠY APP TRÊN ĐIỆN THOẠI

**Mở PowerShell/Terminal mới** (giữ terminal backend chạy) và chạy:

```powershell
cd d:\DAKT\mobile-app\elderly_care_app
flutter run
```

**Lần đầu tiên sẽ mất 5-10 phút để build!**

---

## 🎯 BƯỚC 3: SỬ DỤNG HOT RELOAD

Sau khi app đã chạy trên điện thoại, trong terminal bạn sẽ thấy:

```
Flutter run key commands.
r Hot reload. 🔥🔥🔥
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).
```

### **Khi sửa code Flutter:**

1. **Sửa file Dart** (ví dụ: thay đổi màu, text, logic)
2. **Lưu file** (Ctrl+S)
3. **Nhấn `r`** trong terminal
4. **Xem thay đổi ngay lập tức** trên điện thoại! 🎉

### **Ví dụ thực tế:**

```dart
// Trước - trong lib/screens/login_screen.dart
Text('Đăng nhập', style: TextStyle(fontSize: 24))

// Sau - thay đổi
Text('Đăng nhập hệ thống', style: TextStyle(fontSize: 28, color: Colors.blue))

// Lưu file → Nhấn 'r' → Thấy ngay!
```

---

## 🔄 CÁC LỆNH QUAN TRỌNG

| Phím | Chức năng | Khi nào dùng |
|------|-----------|--------------|
| **r** | Hot Reload | Sau khi sửa UI, logic, text |
| **R** | Hot Restart | Sau khi thêm package, thay đổi lớn |
| **q** | Thoát | Dừng app và thoát flutter run |
| **h** | Help | Xem tất cả lệnh |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **Khi nào cần Hot Restart (R)?**
- Thêm/xóa package trong `pubspec.yaml`
- Thay đổi `main()` function
- Thay đổi global variables
- Thêm/xóa assets (hình ảnh, fonts)

### **Khi nào cần chạy lại `flutter run`?**
- Thay đổi native code (Android/iOS)
- Thay đổi permissions trong AndroidManifest.xml
- Thay đổi cấu hình build.gradle

### **Backend changes:**
- Sửa code backend → Restart service đó
- App sẽ tự động gọi API mới
- **KHÔNG** cần reload app

---

## 🔥 WORKFLOW HIỆU QUẢ

```
┌─────────────────────────────────────────┐
│ Terminal 1: Backend Services            │
│ cd d:\DAKT                              │
│ .\start.ps1                             │
│ (Giữ chạy)                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Terminal 2: Flutter App                 │
│ cd d:\DAKT\mobile-app\elderly_care_app  │
│ flutter run                             │
│ (Giữ chạy, nhấn 'r' khi cần)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ VS Code: Sửa code                       │
│ Sửa file .dart → Lưu → Nhấn 'r'        │
│ Thấy thay đổi ngay trên điện thoại!    │
└─────────────────────────────────────────┘
```

---

## 🐛 KHẮC PHỤC SỰ CỐ

### **App không kết nối được backend:**
```powershell
# Kiểm tra backend đang chạy
curl http://localhost:5041/api/health

# Kiểm tra firewall
# Tạm thời tắt Windows Firewall để test
```

### **Hot Reload không hoạt động:**
```powershell
# Nhấn 'R' (Hot Restart) thay vì 'r'
# Hoặc dừng và chạy lại
q
flutter run
```

### **Build failed:**
```powershell
# Clean và rebuild
flutter clean
flutter pub get
flutter run
```

### **Điện thoại mất kết nối:**
```powershell
# Kiểm tra kết nối
flutter devices

# Nếu không thấy, restart ADB
adb kill-server
adb start-server
flutter devices
```

---

## 📊 THEO DÕI LOGS

### **Xem logs chi tiết:**
```powershell
# Trong terminal đang chạy flutter run
# Logs sẽ tự động hiển thị

# Hoặc mở terminal mới
flutter logs
```

### **Xem logs Android:**
```powershell
adb logcat | Select-String "flutter"
```

---

## 🎉 SẴN SÀNG!

Bây giờ bạn có thể:
1. ✅ Chạy backend services
2. ✅ Chạy `flutter run`
3. ✅ Sửa code và nhấn `r` để xem ngay
4. ✅ Phát triển nhanh chóng với Hot Reload!

**Chúc bạn code vui vẻ! 🚀**
