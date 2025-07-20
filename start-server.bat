@echo off
title EduHub Server Startup
color 0A

echo ========================================
echo       EduHub Server Startup
echo ========================================
echo.

echo [1/4] Checking for running Node processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo Found running Node processes. Stopping them...
    taskkill /f /im node.exe /t >NUL 2>&1
    timeout /t 2 /nobreak >NUL
    echo ✅ Node processes stopped
) else (
    echo ✅ No conflicting Node processes found
)

echo.
echo [2/4] Checking port 5000 availability...
netstat -ano | findstr :5000 >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Port 5000 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /f /pid %%a >NUL 2>&1
    )
    timeout /t 2 /nobreak >NUL
    echo ✅ Port 5000 freed
) else (
    echo ✅ Port 5000 is available
)

echo.
echo [3/4] Navigating to server directory...
cd /d "%~dp0"
if exist "server.js" (
    echo ✅ Found server.js
) else (
    echo ❌ server.js not found in current directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo.
echo [4/4] Starting EduHub server...
echo ========================================
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

if "%ERRORLEVEL%"=="0" (
    echo.
    echo ✅ Server stopped gracefully
) else (
    echo.
    echo ❌ Server stopped with error code: %ERRORLEVEL%
)

echo.
echo Press any key to exit...
pause >NUL
