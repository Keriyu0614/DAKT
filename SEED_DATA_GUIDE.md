# Hướng dẫn Dữ liệu Mẫu (Seed Data)

## Tổng quan

Hệ thống đã được cấu hình để tự động thêm dữ liệu mẫu vào database khi khởi động lần đầu. Dữ liệu sẽ được **lưu trữ lâu dài** (persist) trong Docker volume và không bị mất khi restart services.

## Dữ liệu Mẫu Được Tạo

### 1. Tài khoản người dùng (AuthService)

#### Người chăm sóc (Caregivers):
- **Email:** caregiver1@example.com  
  **Mật khẩu:** 123456  
  **Tên:** Nguyễn Văn An  
  **Quản lý:** 2 người cao tuổi (elderly1, elderly2)

- **Email:** caregiver2@example.com  
  **Mật khẩu:** 123456  
  **Tên:** Trần Thị Bình  
  **Quản lý:** 1 người cao tuổi (elderly3)

#### Người cao tuổi (Elderly):
- **Email:** elderly1@example.com  
  **Mật khẩu:** 123456  
  **Tên:** Lê Văn Cường  
  **Được chăm sóc bởi:** caregiver1

- **Email:** elderly2@example.com  
  **Mật khẩu:** 123456  
  **Tên:** Phạm Thị Dung  
  **Được chăm sóc bởi:** caregiver1

- **Email:** elderly3@example.com  
  **Mật khẩu:** 123456  
  **Tên:** Hoàng Văn Em  
  **Được chăm sóc bởi:** caregiver2

### 2. Thuốc (MedicationService)

Mỗi người cao tuổi có 2-3 loại thuốc với lịch uống khác nhau:
- Aspirin, Metformin, Vitamin D3 (elderly1)
- Amlodipine, Omeprazole (elderly2)
- Paracetamol, Calcium + Vitamin D (elderly3)

### 3. Lịch khám (AppointmentService)

Tổng cộng 5 cuộc hẹn khám bệnh trong tương lai gần (2-10 ngày tới) với các bác sĩ và địa điểm khác nhau.

### 4. Nhật ký sức khỏe (HealthTrackingService)

Dữ liệu theo dõi sức khỏe hàng ngày cho mỗi người cao tuổi:
- elderly1: 7 ngày dữ liệu
- elderly2: 5 ngày dữ liệu
- elderly3: 3 ngày dữ liệu

Bao gồm: huyết áp, nhịp tim, cân nặng, ghi chú.

## Cách Khởi động Hệ thống

### Bước 1: Khởi động Docker và Services

```powershell
.\start.ps1
```

Script này sẽ:
1. Khởi động Docker containers (SQL Server, Redis, RabbitMQ)
2. Chờ 10 giây để database sẵn sàng
3. Khởi động tất cả backend services
4. Khởi động Socket Server
5. Khởi động Web App

### Bước 2: Kiểm tra Dữ liệu

Sau khi tất cả services đã khởi động (khoảng 30-60 giây), truy cập:

- **Web App:** http://localhost:5173
- **Đăng nhập với:** caregiver1@example.com / 123456

Bạn sẽ thấy:
- Dashboard với thống kê
- Danh sách thuốc
- Lịch khám
- Dữ liệu sức khỏe

## Lưu trữ Dữ liệu (Data Persistence)

### Docker Volume

Database được lưu trong Docker volume `sqlserver-data`:

```yaml
volumes:
  sqlserver-data:
```

Điều này có nghĩa:
- ✅ Dữ liệu **KHÔNG bị mất** khi stop/restart containers
- ✅ Dữ liệu **KHÔNG bị mất** khi tắt terminal
- ✅ Dữ liệu **KHÔNG bị mất** khi restart máy tính
- ❌ Dữ liệu **CHỈ bị mất** khi xóa volume: `docker volume rm elderly-care_sqlserver-data`

### Kiểm tra Volume

```powershell
# Xem danh sách volumes
docker volume ls

# Xem thông tin chi tiết
docker volume inspect elderly-care_sqlserver-data
```

## Reset Dữ liệu

Nếu bạn muốn reset về dữ liệu mẫu ban đầu:

### Cách 1: Xóa và tạo lại volume

```powershell
# Dừng tất cả containers
docker compose down

# Xóa volume
docker volume rm elderly-care_sqlserver-data

# Khởi động lại
.\start.ps1
```

### Cách 2: Xóa database trong SQL Server

```powershell
# Kết nối vào SQL Server container
docker exec -it elderly-care-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P Student_12345

# Xóa databases
DROP DATABASE AuthDb;
DROP DATABASE AppointmentDb;
DROP DATABASE MedicationDb;
DROP DATABASE HealthTrackingDb;
GO
```

Sau đó restart các services để tự động tạo lại database và seed data.

## Cơ chế Seed Data

### Tự động Seed khi Khởi động

Mỗi service có logic seed trong `Program.cs`:

```csharp
// Apply migrations
context.Database.Migrate();

// Seed initial data (chỉ chạy nếu database trống)
DataSeeder.SeedData(context, logger);
```

### Kiểm tra Trước khi Seed

Mỗi `DataSeeder` kiểm tra xem đã có dữ liệu chưa:

```csharp
if (context.Users.Any())
{
    logger.LogInformation("Database already contains users. Skipping seed.");
    return;
}
```

Điều này đảm bảo:
- ✅ Seed chỉ chạy **một lần** khi database trống
- ✅ Không ghi đè dữ liệu hiện có
- ✅ An toàn khi restart services

## Xử lý Sự cố

### Trang web hiển thị trắng

1. **Kiểm tra console log trong browser** (F12 → Console)
2. **Kiểm tra các services đã chạy chưa:**
   ```powershell
   docker ps
   ```
3. **Kiểm tra logs của services** trong các terminal windows
4. **Đảm bảo đã đợi đủ thời gian** (30-60 giây) để tất cả services khởi động

### Database không có dữ liệu

1. **Kiểm tra logs của services** để xem có lỗi seed không
2. **Kiểm tra kết nối database:**
   ```powershell
   docker logs elderly-care-sqlserver
   ```
3. **Reset database** theo hướng dẫn ở trên

### Services không khởi động

1. **Kiểm tra Docker đã chạy chưa:**
   ```powershell
   docker --version
   docker ps
   ```
2. **Kiểm tra port đã bị chiếm chưa:**
   ```powershell
   netstat -ano | findstr "14330"  # SQL Server
   netstat -ano | findstr "5173"   # Web App
   ```

## Thêm Dữ liệu Mới

Sau khi đăng nhập, bạn có thể:
- Thêm thuốc mới
- Tạo lịch khám mới
- Ghi nhận dữ liệu sức khỏe mới
- Tạo tài khoản người cao tuổi mới

Tất cả dữ liệu này sẽ được lưu trữ lâu dài trong database.

## Kết luận

Hệ thống đã được cấu hình để:
- ✅ Tự động tạo dữ liệu mẫu khi khởi động lần đầu
- ✅ Lưu trữ dữ liệu lâu dài trong Docker volume
- ✅ Không mất dữ liệu khi restart services
- ✅ Dễ dàng reset về trạng thái ban đầu nếu cần

Chúc bạn sử dụng hệ thống hiệu quả! 🎉
