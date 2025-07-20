@echo off
echo 🔄 Restarting EduHub server...

:: Stop any existing server
echo 🛑 Stopping existing server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start the server
echo 🚀 Starting server...
cd /d "%~dp0server"
node server.js
