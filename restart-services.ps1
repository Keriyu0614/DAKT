# Script khoi dong lai services
# Chay: .\restart-services.ps1

Write-Host "`n=== KHOI DONG LAI SERVICES ===" -ForegroundColor Cyan

$projectRoot = $PSScriptRoot

# 1. Kiem tra Docker
Write-Host "`n[1] Kiem tra Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Docker dang chay" -ForegroundColor Green
} else {
    Write-Host "  Docker chua chay. Dang khoi dong..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 10
}

# 2. Khoi dong Backend Services
Write-Host "`n[2] Khoi dong Backend Services..." -ForegroundColor Yellow
$allServices = @("ApiGateway", "AuthService", "MedicationService", "AppointmentService", "HealthTrackingService", "ReminderService", "NotificationService")

foreach ($s in $allServices) {
    $servicePath = Join-Path $projectRoot "backend\$s"
    if (Test-Path $servicePath) {
        Write-Host "  Khoi dong $s..." -ForegroundColor Gray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$servicePath'; Write-Host '--- $s is running ---' -ForegroundColor Green; dotnet run"
    }
}

# 3. Khoi dong SocketServer
Write-Host "`n[3] Khoi dong Socket Server..." -ForegroundColor Yellow
$socketPath = Join-Path $projectRoot "backend\SocketServer"
if (Test-Path $socketPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$socketPath'; Write-Host '--- SocketServer is running ---' -ForegroundColor Green; npm start"
}

Write-Host "`n=== HOAN TAT ===" -ForegroundColor Green
Write-Host "`nDoi 30-60 giay de services khoi dong..." -ForegroundColor Yellow
Write-Host "Sau do truy cap: http://localhost:5173" -ForegroundColor White
Write-Host ""

# Doi 30 giay roi kiem tra
Write-Host "Dang doi 30 giay..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "`nKiem tra trang thai..." -ForegroundColor Yellow
.\debug-webapp.ps1
