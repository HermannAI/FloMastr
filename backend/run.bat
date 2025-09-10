@echo off
REM Windows equivalent of run.sh for backend

echo Activating virtual environment and starting backend...

REM Change to backend directory
cd /d "%~dp0"

REM Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call .venv\Scripts\activate.bat
) else (
    echo No virtual environment found, using system Python
)

REM Start the backend server
echo Starting uvicorn server...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
