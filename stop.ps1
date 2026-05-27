#.\stop.ps1

# Nội dung file stop.ps1
Write-Host "--- Đang dọn dẹp hệ thống ---" -ForegroundColor Cyan

# 1. Tắt Docker
Write-Host "Tắt Docker containers..." -ForegroundColor Yellow
docker compose down

# 2. Tắt các tiến trình .NET (Backend)
Write-Host "Tắt các dịch vụ Backend (.NET)..." -ForegroundColor Yellow
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
Write-Host "Đã tắt các dịch vụ .NET" -ForegroundColor Green

# 3. Tắt các tiến trình Node.js (Frontend & Socket)
Write-Host "Tắt các dịch vụ Node (Frontend, SocketServer)..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Write-Host "Đã tắt các dịch vụ Node.js" -ForegroundColor Green

Write-Host "--- HOÀN TẤT DỌN DẸP ---" -ForegroundColor Cyan
