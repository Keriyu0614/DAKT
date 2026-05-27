# 🌱 Hướng Dẫn Tạo Dữ Liệu Mẫu

## Tổng Quan

Script này tạo 2 tài khoản mẫu với dữ liệu đầy đủ để phát triển và kiểm thử:

### Tài Khoản 1: Người Chăm Sóc
- **Tên:** Nguyễn Thị Mai
- **Email:** mai.nguyen@example.com
- **Mật khẩu:** Caregiver123!
- **Vai trò:** Caregiver (Người chăm sóc)

### Tài Khoản 2: Người Cao Tuổi
- **Tên:** Trần Văn Nam
- **Email:** nam.tran@example.com
- **Mật khẩu:** Elderly123!
- **Vai trò:** Elderly (Người cao tuổi)

## Dữ Liệu Được Tạo

### 1. Thuốc (4 loại)
- **Aspirin 100mg** - 2 lần/ngày (8:00, 20:00)
- **Metformin 500mg** - 2 lần/ngày (7:30, 19:30)
- **Lisinopril 10mg** - 1 lần/ngày (8:00)
- **Vitamin D3 1000 IU** - 1 lần/ngày (9:00)

### 2. Lịch Hẹn (3 cuộc hẹn)
- **Khám tim mạch** - BS. Nguyễn Văn A (3 ngày sau)
- **Tái khám tiểu đường** - BS. Trần Thị B (7 ngày sau)
- **Tư vấn dinh dưỡng online** - BS. Lê Văn C (14 ngày sau)

### 3. Nhắc Nhở (7+ reminders)
- Nhắc nhở uống thuốc tự động
- Nhắc nhở lịch hẹn
- Nhắc nhở tập thể dục

### 4. Liên Kết
- Tài khoản người cao tuổi được liên kết với người chăm sóc
- Người chăm sóc có thể quản lý và theo dõi người cao tuổi

## Cách Sử Dụng

### Phương Pháp 1: Qua Giao Diện Web (Khuyến Nghị)

1. Khởi động ứng dụng web:
   ```bash
   cd web-app/elderly-care-web
   npm run dev
   ```

2. Truy cập trang seed:
   ```
   http://localhost:5173/dev/seed
   ```

3. Nhấn nút "🚀 Tạo Dữ Liệu Mẫu"

4. Đợi quá trình hoàn tất (khoảng 10-15 giây)

5. Sao chép thông tin đăng nhập từ kết quả

6. Đăng nhập bằng một trong hai tài khoản

### Phương Pháp 2: Qua Script (Nâng Cao)

```bash
cd web-app/elderly-care-web
npm run seed
```

## Kiểm Tra Dữ Liệu

### Đăng Nhập Với Tài Khoản Người Cao Tuổi

1. Đăng nhập: `nam.tran@example.com` / `Elderly123!`
2. Kiểm tra:
   - **Dashboard**: Xem tổng quan thuốc và lịch hẹn
   - **Medications**: 4 loại thuốc với lịch uống
   - **Appointments**: 3 lịch hẹn sắp tới
   - **Health**: Dữ liệu sức khỏe
   - **Notifications**: Thông báo tự động
   - **Reports**: Báo cáo phân tích

### Đăng Nhập Với Tài Khoản Người Chăm Sóc

1. Đăng nhập: `mai.nguyen@example.com` / `Caregiver123!`
2. Kiểm tra:
   - **Dashboard**: Xem tổng quan của người được chăm sóc
   - **Elderly Management**: Quản lý người cao tuổi
   - **Switch View**: Chuyển đổi giữa các người cao tuổi
   - **Notifications**: Nhận cảnh báo về người cao tuổi

## Lưu Ý Quan Trọng

⚠️ **CHỈ SỬ DỤNG TRONG MÔI TRƯỜNG PHÁT TRIỂN**

- Không chạy script này trên production
- Dữ liệu mẫu có thể ghi đè dữ liệu hiện có
- Nên chạy trên database test/development

## Xử Lý Lỗi

### Lỗi: "Email already exists"
**Giải pháp:** Tài khoản đã tồn tại. Xóa tài khoản cũ hoặc thay đổi email trong script.

### Lỗi: "Cannot connect to API"
**Giải pháp:** 
1. Kiểm tra backend đang chạy
2. Kiểm tra `VITE_API_BASE_URL` trong `.env`
3. Kiểm tra CORS settings

### Lỗi: "Failed to create medication"
**Giải pháp:**
1. Kiểm tra MedicationService đang hoạt động
2. Kiểm tra database connection
3. Xem logs backend để biết chi tiết

## Dọn Dẹp Dữ Liệu

Để xóa dữ liệu mẫu:

```sql
-- Xóa theo email
DELETE FROM Users WHERE Email IN ('mai.nguyen@example.com', 'nam.tran@example.com');

-- Hoặc xóa toàn bộ database và migrate lại
```

## Mở Rộng

Để thêm dữ liệu mẫu:

1. Mở `src/scripts/seedSampleAccounts.ts`
2. Thêm dữ liệu vào các mảng tương ứng:
   - `medications[]`
   - `appointments[]`
   - `reminders[]`
3. Chạy lại script

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
- Console logs trong browser (F12)
- Backend logs
- Network tab để xem API calls
- Database để xác nhận dữ liệu được tạo

## Changelog

### v1.0.0 (2026-05-23)
- Tạo 2 tài khoản mẫu
- 4 loại thuốc với lịch uống
- 3 lịch hẹn
- 7+ nhắc nhở tự động
- Liên kết caregiver-elderly
- Giao diện web để chạy seed
