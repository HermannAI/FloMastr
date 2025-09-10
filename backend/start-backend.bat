@echo off
REM FloMastr Backend Startup Script
REM This script ensures we're in the correct directory and sets up environment before starting the backend

echo 🚀 Starting FloMastr Backend Server...
echo.

REM Change to the backend directory
cd /d "%~dp0"

REM Verify we're in the right location
if not exist "main.py" (
    echo ❌ ERROR: main.py not found in current directory
    echo Current directory: %CD%
    echo This script should be in the backend folder
    pause
    exit /b 1
)

REM Set up the database connection
set DATABASE_URL=postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require

echo ✅ Found main.py in: %CD%
echo ✅ Database URL configured
echo ✅ Starting uvicorn server on http://localhost:8000
echo.

REM Start the backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
