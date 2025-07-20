# EduHub Server Startup Script (PowerShell)
param(
    [switch]$Force,
    [int]$Port = 5000
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "       EduHub Server Startup" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false  # Port is free
    }
    catch {
        return $true   # Port is in use
    }
}

# Step 1: Stop existing Node processes
Write-Host "[1/4] Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node process(es). Stopping them..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Node processes stopped" -ForegroundColor Green
} else {
    Write-Host "✅ No conflicting Node processes found" -ForegroundColor Green
}

# Step 2: Check port availability
Write-Host ""
Write-Host "[2/4] Checking port $Port availability..." -ForegroundColor Yellow
if (Test-Port -Port $Port) {
    Write-Host "⚠️  Port $Port is in use. Attempting to free it..." -ForegroundColor Yellow
    
    # Get processes using the port and kill them
    $connections = netstat -ano | Select-String ":$Port " | ForEach-Object {
        $fields = $_.ToString().Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
        if ($fields.Length -ge 5) {
            $fields[-1]  # Get PID (last field)
        }
    }
    
    $connections | Sort-Object -Unique | ForEach-Object {
        try {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            Write-Host "Killed process with PID: $_" -ForegroundColor Gray
        } catch {
            # Ignore errors - process might already be dead
        }
    }
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Port $Port freed" -ForegroundColor Green
} else {
    Write-Host "✅ Port $Port is available" -ForegroundColor Green
}

# Step 3: Navigate to server directory
Write-Host ""
Write-Host "[3/4] Checking server directory..." -ForegroundColor Yellow
$serverPath = Join-Path $PSScriptRoot "server.js"
if (Test-Path $serverPath) {
    Write-Host "✅ Found server.js at: $serverPath" -ForegroundColor Green
} else {
    Write-Host "❌ server.js not found in: $PSScriptRoot" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 4: Start the server
Write-Host ""
Write-Host "[4/4] Starting EduHub server..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Admin login: http://localhost:${Port}/admin-login.html" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Change to server directory and start
Set-Location $PSScriptRoot
try {
    node server.js
    Write-Host ""
    Write-Host "✅ Server stopped gracefully" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Server stopped with error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
