#.\start.ps1

# Noi dung file start.ps1
$projectRoot = $PSScriptRoot

Write-Host "--- Dang khoi dong he thong Elderly Care ---" -ForegroundColor Cyan

# 1. Bat Docker (SQL Server, Redis, RabbitMQ)
Write-Host "Khoi dong Docker..." -ForegroundColor Yellow
cd $projectRoot
docker compose up -d

# Cho SQL Server va RabbitMQ san sang (tang len 20 giay de dam bao)
Write-Host "Dang cho Docker containers san sang (20 giay)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Kiem tra RabbitMQ da san sang chua (thu toi da 5 lan)
Write-Host "Kiem tra RabbitMQ..." -ForegroundColor Yellow
$rabbitReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:15672" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "  RabbitMQ san sang!" -ForegroundColor Green
            $rabbitReady = $true
            break
        }
    } catch {
        Write-Host "  RabbitMQ chua san sang, thu lai lan $i/5..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}
if (-not $rabbitReady) {
    Write-Host "  CANH BAO: RabbitMQ co the chua san sang. Tiep tuc khoi dong..." -ForegroundColor Red
}

# 2. Chay cac Service Backend (khong migration)
Write-Host "Khoi dong cac dich vu Backend..." -ForegroundColor Yellow
$allServices = @(
    "ApiGateway",
    "AuthService",
    "MedicationService",
    "AppointmentService",
    "HealthTrackingService",
    "ReminderService",
    "NotificationService",
    "EmergencyService"
)

foreach ($s in $allServices) {
    $servicePath = Join-Path $projectRoot "backend\$s"
    if (Test-Path $servicePath) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$servicePath'; Write-Host '--- $s is running ---' -ForegroundColor Green; dotnet run"
        Write-Host "  Khoi dong $s..." -ForegroundColor Gray
    } else {
        Write-Host "  CANH BAO: Khong tim thay $servicePath" -ForegroundColor Red
    }
}

# 2b. Chay SocketServer (Node.js)
Write-Host "Khoi dong Socket Server..." -ForegroundColor Yellow
$socketPath = Join-Path $projectRoot "backend\SocketServer"
if (Test-Path $socketPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$socketPath'; Write-Host '--- SocketServer is running ---' -ForegroundColor Green; npm start"
}

# 3. Chay Frontend
Write-Host "Khoi dong Frontend Web App..." -ForegroundColor Yellow
$webPath = Join-Path $projectRoot "web-app\elderly-care-web"
if (Test-Path $webPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$webPath'; Write-Host '--- Web App is running ---' -ForegroundColor Green; npm run dev"
}

Write-Host "Dang doi cac dich vu khoi dong (5 giay)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "HOAN TAT! He thong dang khoi dong..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTHONG TIN QUAN TRONG:" -ForegroundColor Cyan
Write-Host "  Doi 30-60 giay de tat ca services san sang" -ForegroundColor Yellow
Write-Host "  Web App:          http://localhost:5173" -ForegroundColor White
Write-Host "  RabbitMQ UI:      http://localhost:15672  (guest/guest)" -ForegroundColor White
Write-Host "  DB Adminer:       http://localhost:8080" -ForegroundColor White
Write-Host "  Dang nhap:        caregiver1@example.com / 123456" -ForegroundColor White

Write-Host "`nCAC SERVICES BACKEND:" -ForegroundColor Cyan
Write-Host "  ApiGateway:       http://localhost:5041" -ForegroundColor Gray
Write-Host "  AuthService:      http://localhost:5004" -ForegroundColor Gray
Write-Host "  AppointmentSvc:   http://localhost:5001" -ForegroundColor Gray
Write-Host "  MedicationSvc:    http://localhost:5002" -ForegroundColor Gray
Write-Host "  HealthSvc:        http://localhost:5003" -ForegroundColor Gray
Write-Host "  ReminderSvc:      http://localhost:5005" -ForegroundColor Gray
Write-Host "  NotificationSvc:  http://localhost:5006" -ForegroundColor Gray
Write-Host "  EmergencyService: http://localhost:5007" -ForegroundColor Gray
Write-Host "  SocketServer:     http://localhost:5008" -ForegroundColor Gray

Write-Host "`nDU LIEU MAU:" -ForegroundColor Cyan
Write-Host "  - 5 tai khoan nguoi dung" -ForegroundColor Gray
Write-Host "  - 7 loai thuoc voi lich uong" -ForegroundColor Gray
Write-Host "  - 5 lich kham benh" -ForegroundColor Gray
Write-Host "  - 15 ban ghi suc khoe" -ForegroundColor Gray

Write-Host "`nLENH HUU ICH:" -ForegroundColor Cyan
Write-Host "  .\check-status.ps1  - Kiem tra trang thai" -ForegroundColor Gray
Write-Host "  .\reset-data.ps1    - Reset du lieu" -ForegroundColor Gray

Write-Host "`nTAI LIEU:" -ForegroundColor Cyan
Write-Host "  HUONG_DAN_SU_DUNG.md  - Huong dan chi tiet" -ForegroundColor Gray
Write-Host "  SEED_DATA_GUIDE.md    - Thong tin du lieu mau" -ForegroundColor Gray

Write-Host "`nLUU Y:" -ForegroundColor Cyan
Write-Host "  - Du lieu KHONG bi mat khi dong terminal" -ForegroundColor Gray
Write-Host "  - Du lieu duoc luu trong Docker volume" -ForegroundColor Gray
Write-Host "  - Co the them du lieu moi sau khi dang nhap" -ForegroundColor Gray

Write-Host "`nChuc ban su dung thanh cong!" -ForegroundColor Green
Write-Host ""
