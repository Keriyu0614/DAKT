# Script kiem tra trang thai he thong
# Chay: .\check-status.ps1

Write-Host "`n=== KIEM TRA TRANG THAI HE THONG ===" -ForegroundColor Cyan

# 1. Kiem tra Docker
Write-Host "`n[1] Kiem tra Docker Containers..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "elderly-care"

# 2. Kiem tra Docker Volumes
Write-Host "`n[2] Kiem tra Docker Volumes..." -ForegroundColor Yellow
docker volume ls | Select-String "elderly-care"

# 3. Kiem tra cac port dang duoc su dung
Write-Host "`n[3] Kiem tra Ports..." -ForegroundColor Yellow
$ports = @(14330, 5672, 6379, 5041, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5173)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        Write-Host "  Port $port : DANG SU DUNG ($($process.ProcessName))" -ForegroundColor Green
    } else {
        Write-Host "  Port $port : TRONG" -ForegroundColor Red
    }
}

# 4. Kiem tra ket noi SQL Server
Write-Host "`n[4] Kiem tra SQL Server..." -ForegroundColor Yellow
try {
    $result = docker exec elderly-care-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P Student_12345 -Q "SELECT name FROM sys.databases WHERE name IN ('AuthDb', 'AppointmentDb', 'MedicationDb', 'HealthTrackingDb')" 2>&1
    if ($result -match "AuthDb") {
        Write-Host "  SQL Server dang chay va co databases" -ForegroundColor Green
        Write-Host $result
    } else {
        Write-Host "  SQL Server chua co databases" -ForegroundColor Red
    }
} catch {
    Write-Host "  Khong the ket noi SQL Server" -ForegroundColor Red
}

# 5. Kiem tra Web App
Write-Host "`n[5] Kiem tra Web App..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  Web App dang chay (http://localhost:5173)" -ForegroundColor Green
    }
} catch {
    Write-Host "  Web App chua san sang" -ForegroundColor Red
}

# 6. Kiem tra API Gateway
Write-Host "`n[6] Kiem tra API Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5041/swagger" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  API Gateway dang chay (http://localhost:5041)" -ForegroundColor Green
    }
} catch {
    Write-Host "  API Gateway chua san sang" -ForegroundColor Red
}

Write-Host "`n=== HOAN TAT KIEM TRA ===" -ForegroundColor Cyan
Write-Host "`nGoi y:" -ForegroundColor White
Write-Host "  - Neu Docker containers chua chay: docker compose up -d" -ForegroundColor Gray
Write-Host "  - Neu services chua chay: .\start.ps1" -ForegroundColor Gray
Write-Host "  - Neu can reset du lieu: docker compose down && docker volume rm elderly-care_sqlserver-data" -ForegroundColor Gray
Write-Host ""
