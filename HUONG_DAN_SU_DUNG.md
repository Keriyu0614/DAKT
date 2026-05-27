# 📖 Hướng Dẫn Sử Dụng Nhanh

## 🎯 Bắt đầu trong 3 bước

### Bước 1: Khởi động hệ thống
```powershell
.\start.ps1
```
Script này sẽ tự động:
- ✅ Khởi động Docker (SQL Server, Redis, RabbitMQ)
- ✅ Khởi động tất cả backend services
- ✅ Khởi động Web App
- ✅ Tạo dữ liệu mẫu (nếu database trống)

### Bước 2: Đợi services khởi động
⏱️ Đợi khoảng **30-60 giây** để tất cả services sẵn sàng.

Bạn sẽ thấy nhiều cửa sổ PowerShell mở ra, mỗi cửa sổ chạy một service.

### Bước 3: Truy cập Web App
🌐 Mở trình duyệt và truy cập: **http://localhost:5173**

## 🔐 Đăng nhập

### Tài khoản Người chăm sóc (Caregiver)
```
Email: caregiver1@example.com
Mật khẩu: 123456
```

Tài khoản này quản lý 2 người cao tuổi và có đầy đủ dữ liệu mẫu.

### Tài khoản khác
```
caregiver2@example.com / 123456
elderly1@example.com / 123456
elderly2@example.com / 123456
elderly3@example.com / 123456
```

## 📊 Dữ liệu có sẵn

Sau khi đăng nhập với `caregiver1@example.com`, bạn sẽ thấy:

### Dashboard
- Tổng quan về người cao tuổi đang quản lý
- Thống kê thuốc, lịch khám
- Hoạt động gần đây

### Quản lý Thuốc
- 7 loại thuốc với lịch uống chi tiết
- Aspirin, Metformin, Vitamin D3, Amlodipine, v.v.

### Lịch Khám
- 5 cuộc hẹn khám bệnh sắp tới
- Thông tin bác sĩ, địa điểm, thời gian

### Theo dõi Sức khỏe
- Dữ liệu huyết áp, nhịp tim, cân nặng
- Biểu đồ theo dõi theo thời gian
- 15 bản ghi sức khỏe

## 🛠️ Các lệnh hữu ích

### Kiểm tra trạng thái hệ thống
```powershell
.\check-status.ps1
```
Hiển thị:
- Trạng thái Docker containers
- Ports đang sử dụng
- Kết nối database
- Trạng thái Web App và API

### Reset dữ liệu về ban đầu
```powershell
.\reset-data.ps1
```
⚠️ **Cảnh báo**: Lệnh này sẽ xóa TẤT CẢ dữ liệu hiện tại!

### Dừng hệ thống
Đóng tất cả cửa sổ PowerShell đang chạy services.

Dừng Docker:
```powershell
docker compose down
```

## 💡 Lưu ý quan trọng

### ✅ Dữ liệu được lưu trữ lâu dài
- Dữ liệu **KHÔNG bị mất** khi đóng terminal
- Dữ liệu **KHÔNG bị mất** khi restart services
- Dữ liệu **KHÔNG bị mất** khi tắt máy tính
- Dữ liệu được lưu trong Docker volume

### ❌ Dữ liệu chỉ bị mất khi
- Chạy lệnh `.\reset-data.ps1`
- Xóa Docker volume thủ công
- Xóa database trong SQL Server

### 🔄 Thêm dữ liệu mới
Sau khi đăng nhập, bạn có thể:
- ➕ Thêm thuốc mới
- ➕ Tạo lịch khám mới
- ➕ Ghi nhận sức khỏe mới
- ➕ Tạo tài khoản người cao tuổi mới

Tất cả sẽ được lưu trữ lâu dài!

## 🐛 Xử lý sự cố

### Trang web hiển thị trắng
1. **Mở Console** (F12 → Console tab)
2. **Kiểm tra lỗi** trong console
3. **Chạy kiểm tra**: `.\check-status.ps1`
4. **Đợi thêm** 30 giây nếu services chưa sẵn sàng

### Không thấy dữ liệu
1. **Kiểm tra đã đăng nhập đúng tài khoản** chưa
2. **Xem logs** trong các cửa sổ PowerShell
3. **Reset dữ liệu**: `.\reset-data.ps1` rồi `.\start.ps1`

### Services không khởi động
1. **Kiểm tra Docker**: `docker ps`
2. **Kiểm tra port**: `netstat -ano | findstr "5173"`
3. **Restart Docker Desktop** nếu cần

## 📞 Cần trợ giúp?

Xem tài liệu chi tiết:
- **[SEED_DATA_GUIDE.md](SEED_DATA_GUIDE.md)** - Chi tiết về dữ liệu mẫu
- **[README.md](README.md)** - Tổng quan hệ thống
- **architecture/** - Kiến trúc và quy tắc

## 🎉 Chúc bạn sử dụng thành công!

Hệ thống đã sẵn sàng với đầy đủ dữ liệu mẫu. Bạn có thể:
- ✅ Xem và quản lý thông tin người cao tuổi
- ✅ Theo dõi lịch uống thuốc
- ✅ Quản lý lịch khám bệnh
- ✅ Ghi nhận và theo dõi sức khỏe
- ✅ Thêm dữ liệu mới và lưu trữ lâu dài

**Bắt đầu ngay**: `.\start.ps1` → Đợi 60 giây → http://localhost:5173 🚀
