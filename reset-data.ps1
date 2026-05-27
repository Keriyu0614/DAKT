# Script reset du lieu ve trang thai ban dau
# Chay: .\reset-data.ps1

Write-Host "`n=== RESET DU LIEU HE THONG ===" -ForegroundColor Cyan

# Xac nhan tu nguoi dung
Write-Host "`nCANH BAO: Script nay se XOA TAT CA du lieu hien tai!" -ForegroundColor Red
$confirm = Read-Host "Ban co chac chan muon tiep tuc? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Da huy." -ForegroundColor Yellow
    exit
}

Write-Host "`n[1] Dung tat ca containers..." -ForegroundColor Yellow
docker compose down

Write-Host "`n[2] Xoa Docker volume (database)..." -ForegroundColor Yellow
docker volume rm elderly-care_sqlserver-data -ErrorAction SilentlyContinue

Write-Host "`n[3] Khoi dong lai Docker containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "`n[4] Doi SQL Server san sang (15 giay)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`nHoan tat! Database da duoc reset." -ForegroundColor Green
Write-Host "`nBuoc tiep theo:" -ForegroundColor White
Write-Host "  1. Chay: .\start.ps1" -ForegroundColor Cyan
Write-Host "  2. Doi 30-60 giay de services khoi dong" -ForegroundColor Cyan
Write-Host "  3. Truy cap: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  4. Dang nhap: caregiver1@example.com / 123456" -ForegroundColor Cyan
Write-Host ""
