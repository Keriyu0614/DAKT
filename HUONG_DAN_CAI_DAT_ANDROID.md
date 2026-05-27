# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG APP TRÊN ĐIỆN THOẠI ANDROID

## 📋 MỤC LỤC
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Chuẩn bị điện thoại Android](#chuẩn-bị-điện-thoại-android)
3. [Cài đặt Flutter và Android SDK](#cài-đặt-flutter-và-android-sdk)
4. [Kết nối điện thoại với máy tính](#kết-nối-điện-thoại-với-máy-tính)
5. [Chạy ứng dụng trên điện thoại](#chạy-ứng-dụng-trên-điện-thoại)
6. [Build file APK để cài đặt](#build-file-apk-để-cài-đặt)
7. [Khắc phục sự cố](#khắc-phục-sự-cố)

---

## 🔧 YÊU CẦU HỆ THỐNG

### Trên máy tính Windows:
- Windows 10 hoặc mới hơn
- Ít nhất 8GB RAM (khuyến nghị 16GB)
- Ít nhất 10GB dung lượng trống
- Flutter SDK
- Android Studio hoặc Android SDK Command-line Tools
- USB cable để kết nối điện thoại

### Trên điện thoại Android:
- Android 5.0 (API level 21) trở lên
- Khoảng 100MB dung lượng trống
- Bật chế độ Developer Options và USB Debugging

---

## 📱 CHUẨN BỊ ĐIỆN THOẠI ANDROID

### Bước 1: Bật chế độ Developer Options

1. Mở **Settings** (Cài đặt) trên điện thoại
2. Tìm **About phone** (Thông tin điện thoại)
3. Tìm **Build number** (Số bản dựng)
4. **Nhấn 7 lần** vào Build number
5. Nhập mật khẩu/PIN nếu được yêu cầu
6. Bạn sẽ thấy thông báo "You are now a developer!" (Bạn đã là nhà phát triển!)

### Bước 2: Bật USB Debugging

1. Quay lại **Settings** (Cài đặt)
2. Tìm **Developer options** (Tùy chọn nhà phát triển) - thường ở cuối danh sách
3. Bật **Developer options** (nếu đang tắt)
4. Tìm và bật **USB debugging**
5. Xác nhận "Allow USB debugging" khi có popup

### Bước 3: Cài đặt USB Driver (nếu cần)

- Hầu hết điện thoại Android hiện đại không cần driver riêng
- Nếu máy tính không nhận diện điện thoại, tải driver từ trang web nhà sản xuất:
  - Samsung: Samsung USB Driver
  - Xiaomi: Mi USB Driver
  - Oppo/Realme: Oppo USB Driver
  - Vivo: Vivo USB Driver

---

## 💻 CÀI ĐẶT FLUTTER VÀ ANDROID SDK

### Bước 1: Cài đặt Flutter

1. **Tải Flutter SDK:**
   - Truy cập: https://docs.flutter.dev/get-started/install/windows
   - Tải file ZIP Flutter SDK (khoảng 1.5GB)

2. **Giải nén Flutter:**
   ```
   Giải nén file ZIP vào thư mục, ví dụ: C:\flutter
   KHÔNG giải nén vào thư mục yêu cầu quyền admin như C:\Program Files
   ```

3. **Thêm Flutter vào PATH:**
   - Mở **System Properties** → **Environment Variables**
   - Trong **User variables**, tìm **Path** và click **Edit**
   - Click **New** và thêm: `C:\flutter\bin`
   - Click **OK** để lưu

4. **Kiểm tra cài đặt:**
   ```powershell
   flutter --version
   flutter doctor
   ```

### Bước 2: Cài đặt Android Studio (Khuyến nghị)

1. **Tải Android Studio:**
   - Truy cập: https://developer.android.com/studio
   - Tải và cài đặt Android Studio

2. **Cài đặt Android SDK:**
   - Mở Android Studio
   - Vào **Tools** → **SDK Manager**
   - Trong tab **SDK Platforms**, chọn:
     - Android 13.0 (API 33) hoặc mới hơn
   - Trong tab **SDK Tools**, chọn:
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools
     - Android Emulator (tùy chọn)
   - Click **Apply** để cài đặt

3. **Cấu hình Flutter với Android SDK:**
   ```powershell
   flutter config --android-sdk "C:\Users\[YourUsername]\AppData\Local\Android\Sdk"
   ```

4. **Chấp nhận licenses:**
   ```powershell
   flutter doctor --android-licenses
   ```
   Nhấn `y` để chấp nhận tất cả licenses

### Bước 3: Kiểm tra cài đặt hoàn chỉnh

```powershell
flutter doctor -v
```

Kết quả mong muốn:
```
[✓] Flutter (Channel stable, ...)
[✓] Android toolchain - develop for Android devices
[✓] Connected device (1 available)
```

---

## 🔌 KẾT NỐI ĐIỆN THOẠI VỚI MÁY TÍNH

### Bước 1: Kết nối bằng cáp USB

1. **Cắm cáp USB** từ điện thoại vào máy tính
2. Trên điện thoại, chọn **File Transfer** hoặc **MTP mode** (không phải chỉ sạc)
3. Popup "Allow USB debugging?" sẽ xuất hiện → Chọn **Allow** (Cho phép)
4. Tùy chọn: Chọn "Always allow from this computer" để không phải cho phép lại

### Bước 2: Kiểm tra kết nối

Mở PowerShell hoặc Command Prompt và chạy:

```powershell
flutter devices
```

Kết quả mong muốn:
```
2 connected devices:

SM G991B (mobile) • R5CR1234ABC • android-arm64 • Android 13 (API 33)
Windows (desktop) • windows      • windows-x64   • Microsoft Windows ...
```

Nếu thấy tên điện thoại của bạn → **Thành công!**

### Bước 3: Khắc phục nếu không thấy thiết bị

```powershell
# Kiểm tra ADB có nhận diện thiết bị không
adb devices

# Nếu không có, thử restart ADB server
adb kill-server
adb start-server
adb devices
```

Nếu vẫn không thấy:
- Thử cáp USB khác
- Thử cổng USB khác trên máy tính
- Tắt và bật lại USB Debugging
- Khởi động lại điện thoại

---

## 🚀 CHẠY ỨNG DỤNG TRÊN ĐIỆN THOẠI

### Bước 1: Khởi động Backend Services

Trước khi chạy app, bạn cần khởi động các backend services:

```powershell
# Di chuyển đến thư mục project
cd d:\DAKT

# Chạy script khởi động (nếu có)
.\start.ps1
```

Hoặc khởi động thủ công từng service:
- ApiGateway: http://localhost:5041
- AuthService: http://localhost:5004
- AppointmentService: http://localhost:5001
- MedicationService: http://localhost:5002
- HealthTrackingService: http://localhost:5003
- ReminderService: http://localhost:5005
- NotificationService: http://localhost:5006

### Bước 2: Cấu hình API endpoint

**QUAN TRỌNG:** App cần kết nối đến backend trên máy tính của bạn.

1. Tìm địa chỉ IP của máy tính:
   ```powershell
   ipconfig
   ```
   Tìm **IPv4 Address** (ví dụ: 192.168.1.100)

2. Cập nhật API endpoint trong app:
   - Mở file: `d:\DAKT\mobile-app\elderly_care_app\lib\services\api_service.dart`
   - Thay đổi `localhost` thành địa chỉ IP của máy tính
   - Ví dụ: `http://192.168.1.100:5041`

### Bước 3: Chạy app trên điện thoại

```powershell
# Di chuyển đến thư mục app
cd d:\DAKT\mobile-app\elderly_care_app

# Cài đặt dependencies (lần đầu tiên)
flutter pub get

# Chạy app ở chế độ debug
flutter run
```

**Lưu ý:**
- Lần đầu tiên sẽ mất 5-10 phút để build
- App sẽ tự động cài đặt và mở trên điện thoại
- Bạn sẽ thấy logs trong terminal

### Bước 4: Chọn thiết bị (nếu có nhiều thiết bị)

Nếu có nhiều thiết bị kết nối:

```powershell
# Xem danh sách thiết bị
flutter devices

# Chạy trên thiết bị cụ thể
flutter run -d <device-id>

# Ví dụ:
flutter run -d R5CR1234ABC
```

---

## 📦 BUILD FILE APK ĐỂ CÀI ĐẶT

Nếu bạn muốn tạo file APK để cài đặt độc lập (không cần kết nối máy tính):

### Bước 1: Build APK

```powershell
cd d:\DAKT\mobile-app\elderly_care_app

# Build APK (debug version - để test)
flutter build apk --debug

# Hoặc build APK (release version - để sử dụng thực tế)
flutter build apk --release
```

### Bước 2: Tìm file APK

File APK sẽ được tạo tại:
```
d:\DAKT\mobile-app\elderly_care_app\build\app\outputs\flutter-apk\app-debug.apk
```
hoặc
```
d:\DAKT\mobile-app\elderly_care_app\build\app\outputs\flutter-apk\app-release.apk
```

### Bước 3: Cài đặt APK lên điện thoại

**Cách 1: Qua ADB**
```powershell
adb install build\app\outputs\flutter-apk\app-release.apk
```

**Cách 2: Copy file APK**
1. Copy file APK vào điện thoại (qua USB, email, hoặc cloud)
2. Trên điện thoại, mở file APK
3. Cho phép "Install from unknown sources" nếu được hỏi
4. Nhấn **Install**

---

## 🔥 CHẠY APP VỚI HOT RELOAD (Phát triển)

Khi đang phát triển, bạn có thể sử dụng Hot Reload để xem thay đổi ngay lập tức:

```powershell
# Chạy app ở chế độ debug
flutter run

# Trong terminal, nhấn:
# r - để hot reload (reload code)
# R - để hot restart (restart app)
# q - để thoát
```

---

## ❗ KHẮC PHỤC SỰ CỐ

### Lỗi: "No devices found"

**Giải pháp:**
```powershell
# Kiểm tra ADB
adb devices

# Restart ADB
adb kill-server
adb start-server

# Kiểm tra lại
flutter devices
```

### Lỗi: "Gradle build failed"

**Giải pháp:**
```powershell
# Xóa cache và rebuild
cd d:\DAKT\mobile-app\elderly_care_app
flutter clean
flutter pub get
flutter run
```

### Lỗi: "Unable to connect to backend"

**Giải pháp:**
1. Kiểm tra backend services đang chạy
2. Kiểm tra firewall không chặn port 5041
3. Đảm bảo điện thoại và máy tính cùng mạng WiFi
4. Thử tắt Windows Firewall tạm thời để test
5. Cập nhật đúng địa chỉ IP trong app

### Lỗi: "Android license not accepted"

**Giải pháp:**
```powershell
flutter doctor --android-licenses
# Nhấn 'y' để chấp nhận tất cả
```

### Điện thoại không hiện popup "Allow USB debugging"

**Giải pháp:**
1. Tắt và bật lại USB Debugging
2. Thử chế độ "Revoke USB debugging authorizations" trong Developer Options
3. Rút cáp và cắm lại
4. Khởi động lại điện thoại

### App bị crash khi mở

**Giải pháp:**
```powershell
# Xem logs để debug
flutter logs

# Hoặc xem logs Android
adb logcat
```

---

## 📝 CHECKLIST NHANH

- [ ] Bật Developer Options trên điện thoại
- [ ] Bật USB Debugging
- [ ] Cài đặt Flutter SDK
- [ ] Cài đặt Android Studio và Android SDK
- [ ] Chạy `flutter doctor` và sửa các vấn đề
- [ ] Kết nối điện thoại qua USB
- [ ] Chạy `flutter devices` để kiểm tra
- [ ] Khởi động backend services
- [ ] Cập nhật API endpoint với IP máy tính
- [ ] Chạy `flutter run`
- [ ] App mở thành công trên điện thoại! 🎉

---

## 🆘 HỖ TRỢ THÊM

### Tài liệu Flutter:
- https://docs.flutter.dev/get-started/install/windows
- https://docs.flutter.dev/deployment/android

### Kiểm tra cấu hình:
```powershell
flutter doctor -v
flutter config
```

### Xem logs chi tiết:
```powershell
flutter run -v
```

---

**Chúc bạn cài đặt thành công! 🚀**

Nếu gặp vấn đề, hãy chạy `flutter doctor -v` và gửi kết quả để được hỗ trợ.
