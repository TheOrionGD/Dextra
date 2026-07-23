<#
.SYNOPSIS
    Starts the Dextra System (Backend + Served Frontend).
.DESCRIPTION
    This script launches the Dextra Python backend with the --all flag, which
    starts the Gesture Tracking Engine, Voice Command Engine, and FastAPI GUI server.
    The GUI server automatically mounts the built React frontend at http://localhost:8000.
#>

$ProjectRoot = $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Starting DEXTRA System              " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if python is available
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Optional: You can uncomment the following line to automatically install dependencies before running
# pip install -r "$ProjectRoot\requirements.txt" | Out-Null

$MainPy = Join-Path $ProjectRoot "python\main.py"
$FrontendDir = Join-Path $ProjectRoot "Frontend"

if (-not (Test-Path $MainPy)) {
    Write-Host "Error: Could not find python\main.py" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendDir)) {
    Write-Host "Error: Could not find Frontend directory" -ForegroundColor Red
    exit 1
}

Write-Host "Booting up Dextra Services..." -ForegroundColor Yellow

# Start Frontend in a separate window
Write-Host "Starting React Frontend Dev Server (npm run dev)..." -ForegroundColor Cyan
Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd `"$FrontendDir`"; npm run dev"

# Start Backend in a separate window
Write-Host "Starting Python Backend (Gesture, Voice, GUI)..." -ForegroundColor Cyan
Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd `"$ProjectRoot`"; python python/main.py --all"

Write-Host "Both Frontend and Backend servers have been started in new terminal windows." -ForegroundColor Green
Write-Host "The dashboard will be available at http://localhost:5173 (Dev) or http://localhost:8000 (Static)" -ForegroundColor Green
