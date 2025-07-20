@echo off
echo 🛑 Stopping EduHub server...

:: Find and kill Node.js processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo 🔍 Found process: %%a
        taskkill /PID %%a /F >nul 2>&1
        if %errorlevel% == 0 (
            echo ✅ Server stopped successfully!
        ) else (
            echo ⚠️ Could not stop process %%a
        )
    )
)

echo 🏁 Server shutdown complete.
pause
