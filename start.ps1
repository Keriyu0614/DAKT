# Nội dung file start.ps1
Write-Host "--- Đang khởi động hệ thống ---" -ForegroundColor Cyan

# 1. Bật Docker
docker compose up -d

# 2. Chạy các Service Backend (không migration)
$allServices = @("ApiGateway", "AuthService", "MedicationService", "AppointmentService", "HealthTrackingService", "ReminderService", "NotificationService")
foreach ($s in $allServices) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/$s; dotnet run"
}

# 3. Chạy Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web-app/elderly-care-web; npm run dev"