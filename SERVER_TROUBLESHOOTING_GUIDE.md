# Server Troubleshooting Guide
## Quick Fix for Connection Issues

---

## 🔧 **Important: Terminal Type**

**VS Code uses PowerShell by default on Windows. Choose the right commands:**

- **PowerShell** (blue prompt): Use `Get-Process`, `Stop-Process`, `Select-String`
- **Command Prompt** (black prompt): Use `tasklist`, `taskkill`, `findstr`

**To check which terminal you're using:**
- Look at the prompt: `PS C:\>` = PowerShell, `C:\>` = Command Prompt
- Or run: `$PSVersionTable` (works only in PowerShell)

---

## 🔧 **Quick Troubleshooting Steps**

### **Step 1: Check Server Status**
```powershell
# Check if server is running (PowerShell)
netstat -ano | Select-String ":5000"

# Or check for node processes (PowerShell)
Get-Process -Name "node" -ErrorAction SilentlyContinue

# Alternative (Command Prompt style)
netstat -ano | findstr :5000
tasklist | findstr node
```

### **Step 2: Kill Conflicting Processes**
```powershell
# Kill all node processes (PowerShell)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Or kill specific port (PowerShell)
netstat -ano | Select-String ":5000"
# Note the PID and kill it
Stop-Process -Id <PID_NUMBER> -Force

# Alternative (Command Prompt style)
taskkill /f /im node.exe
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### **Step 3: Restart Server Cleanly**
```powershell
# PowerShell commands
Set-Location "d:\college2\server"
node server.js

# Alternative (Command Prompt style)
cd d:\college2\server
node server.js
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Cannot connect to server"**

**Symptoms:**
- Browser shows "Connection error. Please try again"
- Upload fails with connection error
- Admin login not working

**Quick Fix:**
1. Open Terminal in VS Code (Ctrl + `)
2. **PowerShell**: `Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force`
3. **CMD**: `taskkill /f /im node.exe`
4. Run: `node server.js`
5. Refresh browser (Ctrl + F5)

**Root Cause:** Multiple server instances running on same port

---

### **Issue 2: "Port 5000 already in use"**

**Symptoms:**
- Server fails to start
- Error: "EADDRINUSE: address already in use :::5000"
- Terminal shows port conflict

**Solution:**
```powershell
# Find what's using port 5000 (PowerShell)
netstat -ano | Select-String ":5000"

# Kill the process using the PID from above command (PowerShell)
Stop-Process -Id <PID_NUMBER> -Force

# Alternative (Command Prompt)
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Start server again
node server.js
```

**Alternative Solution:**
```bash
# Kill all node processes (nuclear option)
taskkill /f /im node.exe

# Wait a moment
timeout /t 3

# Start fresh
node server.js
```

**Root Cause:** Previous server instance didn't shut down properly

---

### **Issue 3: "MongoDB connection error"**

**Symptoms:**
- Server starts but shows "❌ MongoDB connection error"
- Data not saving/loading properly
- Falls back to JSON file storage

**Solutions:**

**Option A: Start MongoDB Service**
```bash
# Start MongoDB service (if installed as service)
net start MongoDB
```

**Option B: Check MongoDB Installation**
```bash
# Check if MongoDB is installed
mongod --version

# If not installed, server will use JSON fallback (still works)
```

**Option C: Manual MongoDB Start**
```bash
# Navigate to MongoDB bin directory (if installed manually)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod
```

**Note:** Your server has JSON file fallback, so it will work even without MongoDB

**Root Cause:** MongoDB service not running or not installed

---

## 📋 **Emergency Restart Checklist**

When everything fails, follow this exact sequence:

### **1. Complete Process Cleanup**
```bash
# Stop all Node processes
taskkill /f /im node.exe

# Wait 5 seconds
timeout /t 5

# Verify port is free
netstat -ano | findstr :5000
```

### **2. Restart MongoDB (if needed)**
```bash
# Stop MongoDB (optional)
net stop MongoDB

# Start MongoDB (optional)
net start MongoDB
```

### **3. Clean Server Start**
```bash
# Navigate to server directory
cd d:\college2\server

# Start server
node server.js
```

### **4. Verify Everything Works**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Create admin account
curl -X POST http://localhost:5000/api/admin/setup -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\",\"email\":\"admin@eduhub.com\"}"
```

---

## 💡 **Pro Tips**

1. **Always use Ctrl+C** to stop the server properly instead of closing the terminal
2. **Keep only one terminal/server running** at a time
3. **If unsure, restart everything** - it fixes 90% of issues
4. **Check the terminal logs** for specific error messages
5. **Default admin credentials**: username: `admin`, password: `admin123`

---

## ⚡ **Quick Reference Commands**

**One-liner server restart:**
```powershell
# PowerShell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 3; Set-Location "d:\college2\server"; node server.js

# Command Prompt
taskkill /f /im node.exe && timeout /t 3 && cd d:\college2\server && node server.js
```

**Check if server is responding:**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# Command Prompt (if curl is available)
curl http://localhost:5000/api/health
```

**Reset admin account:**
```bash
curl -X POST http://localhost:5000/api/admin/clear-all
curl -X POST http://localhost:5000/api/admin/setup -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\",\"email\":\"admin@eduhub.com\"}"
```

---

## 🔍 **Debug Commands**

### **Check What's Running**
```bash
# Check all processes on port 5000
netstat -ano | findstr :5000

# Check Node processes
wmic process where "name='node.exe'" get processid,commandline
```

### **Network Diagnostics**
```bash
# Test localhost connectivity
ping localhost
ping 127.0.0.1

# Test if server responds
curl http://localhost:5000/api/health
```

---

## 🌐 **Browser Issues**

### **Clear Browser Cache**
1. **Chrome/Edge**: Ctrl + Shift + Delete
2. **Hard Refresh**: Ctrl + F5
3. **Disable Cache**: F12 → Network → Disable cache

### **Try Different URLs**
- `http://localhost:5000`
- `http://127.0.0.1:5000`
- `http://[::1]:5000`

---

## 📝 **Create a Restart Script**

Save this as `restart-server.bat` in your `server` folder:

```batch
@echo off
echo Stopping all Node processes...
taskkill /f /im node.exe 2>nul

echo Waiting for processes to close...
timeout /t 3 /nobreak >nul

echo Starting server...
cd /d "d:\college2\server"
node server.js

pause
```

---

**Remember: Most connection issues are solved by killing all Node processes and starting fresh!**
