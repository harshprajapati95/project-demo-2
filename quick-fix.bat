@echo off
title EduHub Quick Fix
color 0A

echo =======================================
echo    EduHub Quick Connection Fix
echo =======================================
echo.

echo [1/4] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Node processes stopped
) else (
    echo     ℹ No Node processes running
)

echo.
echo [2/4] Killing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo     ✓ Port 5000 cleared

echo.
echo [3/4] Starting EduHub server...
cd /d "%~dp0server"
if exist server.js (
    echo     ℹ Starting server in background...
    start /min cmd /c "node server.js"
    timeout /t 5 /nobreak >nul
    echo     ✓ Server started
) else (
    echo     ✗ Server file not found in %CD%
    echo     Expected: %CD%\server.js
)

echo.
echo [4/4] Testing connection...
timeout /t 3 /nobreak >nul
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Server is responding
    echo.
    echo =======================================
    echo         CONNECTION RESTORED!
    echo =======================================
    echo.
    echo Admin Login: http://localhost:5000/admin-login.html
    echo Username: admin
    echo Password: admin123
    echo.
) else (
    echo     ⚠ Server may need more time to start
    echo.
    echo Please wait 30 seconds and try again, or
    echo run fix-connection.ps1 for detailed troubleshooting
    echo.
)

echo Main Site: http://localhost:5000
echo.
pause
