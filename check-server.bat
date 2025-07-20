@echo off
echo 🔍 Checking EduHub server status...
echo.

:: Check if port 5000 is in use
netstat -ano | findstr :5000 >nul
if %errorlevel% == 0 (
    echo ✅ Server is RUNNING on port 5000
    echo 📱 Frontend: http://localhost:5000
    echo 🔧 API: http://localhost:5000/api
    echo 🔑 Admin: http://localhost:5000/admin-login.html
    echo.
    
    :: Show which process is using the port
    echo 📊 Process details:
    for /f "tokens=2,5" %%a in ('netstat -ano ^| findstr :5000') do (
        if not "%%b"=="0" (
            echo    PID: %%b
        )
    )
) else (
    echo ❌ Server is NOT running
    echo 💡 Run 'start-server.bat' to start the server
)

echo.
pause
