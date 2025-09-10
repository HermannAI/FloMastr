# FloMastr Quick Start Script
# Run this from anywhere to start the FloMastr backend correctly

Write-Host "🚀 FloMastr Quick Start" -ForegroundColor Green
Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host ""

# Get the script directory and navigate to backend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path $ScriptDir "backend"

if (-not (Test-Path $BackendDir)) {
    Write-Host "❌ ERROR: Backend directory not found at $BackendDir" -ForegroundColor Red
    exit 1
}

# Execute the backend startup script
& "$BackendDir\start-backend.ps1"
