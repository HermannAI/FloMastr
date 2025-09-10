# FloMastr Backend Startup Script (PowerShell)
# This script ensures we're in the correct directory and sets up environment before starting the backend

Write-Host "🚀 Starting FloMastr Backend Server..." -ForegroundColor Green
Write-Host ""

# Change to the backend directory (where this script is located)
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDirectory

# Verify we're in the right location
if (-not (Test-Path "main.py")) {
    Write-Host "❌ ERROR: main.py not found in current directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "This script should be in the backend folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set up the database connection
$env:DATABASE_URL = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

Write-Host "✅ Found main.py in: $(Get-Location)" -ForegroundColor Green
Write-Host "✅ Database URL configured" -ForegroundColor Green
Write-Host "✅ Starting uvicorn server on http://localhost:8000" -ForegroundColor Green
Write-Host ""

# Start the backend server
try {
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
