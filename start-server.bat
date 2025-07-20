@echo off
echo 🔍 Checking if EduHub server is already running...
netstat -ano | findstr :5000 >nul
if %errorlevel% == 0 (
    echo ✅ Server is already running on port 5000!
    echo 📱 Frontend: http://localhost:5000
    echo 🔧 API: http://localhost:5000/api
    pause
    exit /b 0
)

echo 🚀 Starting EduHub server...
cd /d "%~dp0server"
node server.js
pause
