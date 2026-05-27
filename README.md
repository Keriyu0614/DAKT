# Elderly Care Reminder System

Hệ thống quản lý chăm sóc sức khỏe người cao tuổi với kiến trúc microservices.

## 🚀 Khởi động Nhanh

### 1. Khởi động hệ thống
```powershell
.\start.ps1
```

### 2. Truy cập Web App
- URL: http://localhost:5173
- Đăng nhập: `caregiver1@example.com` / `123456`

### 3. Kiểm tra trạng thái
```powershell
.\check-status.ps1
```

### 4. Reset dữ liệu (nếu cần)
```powershell
.\reset-data.ps1
```

## 📚 Tài liệu

- **[SEED_DATA_GUIDE.md](SEED_DATA_GUIDE.md)** - Hướng dẫn chi tiết về dữ liệu mẫu và cách quản lý
- **architecture/** - Kiến trúc hệ thống và quy tắc phát triển
- **backend/contracts/** - API contracts (đã đóng băng)

## 🏗️ Kiến trúc

### Backend Services
- **ApiGateway**: http://localhost:5000 - Cổng API chính
- **AuthService**: http://localhost:5001 - Xác thực & quản lý người dùng
- **AppointmentService**: http://localhost:5002 - Quản lý lịch khám
- **MedicationService**: http://localhost:5003 - Quản lý thuốc
- **HealthTrackingService**: http://localhost:5004 - Theo dõi sức khỏe
- **ReminderService**: http://localhost:5005 - Nhắc nhở
- **NotificationService**: http://localhost:5006 - Thông báo
- **SocketServer**: http://localhost:3001 - WebSocket real-time

### Frontend
- **Web App**: http://localhost:5173 - Ứng dụng web cho người chăm sóc
- **Mobile App**: React Native - Ứng dụng di động cho người cao tuổi

### Infrastructure
- **SQL Server**: localhost:14330 - Database chính
- **Redis**: localhost:6379 - Cache & session
- **RabbitMQ**: localhost:5672 - Message queue
- **RabbitMQ Management**: http://localhost:15672 - Quản lý RabbitMQ

## 💾 Dữ liệu Mẫu

Hệ thống tự động tạo dữ liệu mẫu khi khởi động lần đầu:

### Tài khoản
- **Người chăm sóc 1**: caregiver1@example.com / 123456
- **Người chăm sóc 2**: caregiver2@example.com / 123456
- **Người cao tuổi 1**: elderly1@example.com / 123456
- **Người cao tuổi 2**: elderly2@example.com / 123456
- **Người cao tuổi 3**: elderly3@example.com / 123456

### Dữ liệu khác
- 7 loại thuốc với lịch uống
- 5 lịch khám bệnh
- 15 bản ghi sức khỏe

Chi tiết xem [SEED_DATA_GUIDE.md](SEED_DATA_GUIDE.md)

## 🔧 Scripts Hữu ích

| Script | Mô tả |
|--------|-------|
| `start.ps1` | Khởi động toàn bộ hệ thống |
| `check-status.ps1` | Kiểm tra trạng thái các services |
| `reset-data.ps1` | Reset dữ liệu về trạng thái ban đầu |

## 📖 Quy tắc Phát triển

⚠️ **QUAN TRỌNG**: Đọc các file sau trước khi thay đổi code:
- `architecture/AI_INSTRUCTIONS.txt`
- `architecture/architecture_overview.md`
- `architecture/core_architecture_rules.md`

### API Contracts
- API contracts trong `/backend/contracts` đã được **đóng băng**
- Frontend phải tuân theo contracts hiện có
- Không thay đổi contracts trừ khi có lý do đặc biệt

## 🐛 Xử lý Sự cố

### Trang web hiển thị trắng
1. Kiểm tra console log (F12 → Console)
2. Chạy `.\check-status.ps1` để kiểm tra services
3. Đợi 30-60 giây để services khởi động hoàn toàn

### Database không có dữ liệu
1. Kiểm tra logs của services
2. Chạy `.\reset-data.ps1` để reset database

### Port bị chiếm
```powershell
# Kiểm tra port đang được sử dụng
netstat -ano | findstr "5173"

# Kill process nếu cần
taskkill /PID <process_id> /F
```

## 📝 Ghi chú

- Dữ liệu được lưu trong Docker volume `elderly-care_sqlserver-data`
- Dữ liệu **KHÔNG bị mất** khi restart services
- Chỉ bị mất khi xóa volume hoặc chạy `reset-data.ps1`

## 📄 License

Academic project - For educational purposes only.