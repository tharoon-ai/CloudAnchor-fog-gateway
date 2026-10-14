# CloudAnchor Startup Helper Script
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CloudAnchor: Fog-Assisted Resilient Gateway Startup    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if port 8000, 8001, or 5173 are already in use
Write-Host "[1/4] Checking environment ports..." -ForegroundColor Gray
$ports = @(8000, 8001, 5173)
foreach ($port in $ports) {
    $portActive = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($portActive) {
        Write-Host "WARNING: Port $port is already active. Please ensure no old uvicorn or vite tasks are running." -ForegroundColor Yellow
    }
}

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

# 1. Launch Cloud API
Write-Host "[2/4] Launching Simulated Cloud API (Port 8001)..." -ForegroundColor Green
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'CloudAnchor - Simulated Cloud API (Port 8001)'; python -m uvicorn cloud_api.main:app --host 127.0.0.1 --port 8001"

# 2. Launch Gateway Backend
Write-Host "[3/4] Launching Fog Gateway Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'CloudAnchor - Fog Gateway Backend (Port 8000)'; python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

# 3. Launch React Frontend
Write-Host "[4/4] Launching React Dev Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -WorkingDirectory "$rootDir\frontend" -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'CloudAnchor - React Frontend (Port 5173)'; npm run dev"

Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host "All processes spawned successfully!" -ForegroundColor Cyan
Write-Host "Please wait a moment for the build process, then open:" -ForegroundColor Gray
Write-Host ">>> http://localhost:5173 <<<" -ForegroundColor Yellow -NoNewline
Write-Host " in your web browser." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
