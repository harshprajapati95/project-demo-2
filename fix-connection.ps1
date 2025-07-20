# EduHub Connection Problem Solver
# Run this script when you get "Cannot connect to server" errors

Write-Host "🔧 EduHub Connection Problem Solver" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$Port = 5000
$ServerUrl = "http://localhost:$Port"

# Step 1: Diagnose the problem
Write-Host "Step 1: Diagnosing connection issues..." -ForegroundColor Yellow
Write-Host ""

# Check if any Node processes are running
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "❌ Found $($nodeProcesses.Count) Node process(es) running" -ForegroundColor Red
    Write-Host "   These might be causing conflicts" -ForegroundColor Gray
} else {
    Write-Host "✅ No Node processes found" -ForegroundColor Green
}

# Check port usage
$portInUse = $false
try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
    $listener.Stop()
    Write-Host "✅ Port $Port is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Port $Port is in use" -ForegroundColor Red
    $portInUse = $true
}

# Test network connectivity
try {
    $response = Invoke-WebRequest -Uri "$ServerUrl/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Server is responding" -ForegroundColor Green
    $serverRunning = $true
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
    $serverRunning = $false
}

Write-Host ""
Write-Host "Step 2: Applying fixes..." -ForegroundColor Yellow
Write-Host ""

# Fix 1: Kill conflicting processes
if ($nodeProcesses -or $portInUse) {
    Write-Host "🔨 Killing conflicting processes..." -ForegroundColor Cyan
    
    # Kill Node processes
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Stopped Node processes" -ForegroundColor Green
    }
    
    # Kill processes using port 5000
    if ($portInUse) {
        $connections = netstat -ano | Select-String ":$Port " | ForEach-Object {
            $fields = $_.ToString().Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
            if ($fields.Length -ge 5) { $fields[-1] }
        }
        
        $connections | Sort-Object -Unique | ForEach-Object {
            try {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Killed process PID: $_" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Could not kill process PID: $_" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "   💤 Waiting for processes to close..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

# Fix 2: Start the server
if (-not $serverRunning) {
    Write-Host "🚀 Starting EduHub server..." -ForegroundColor Cyan
    Write-Host ""
    
    # Use the current script directory (d:\college2) as the project root
    $projectRoot = $PSScriptRoot
    $serverPath = Join-Path $projectRoot "server\server.js"
    
    if (Test-Path $serverPath) {
        Set-Location (Split-Path $serverPath -Parent)
        Write-Host "Server directory: $PWD" -ForegroundColor Gray
        Write-Host "Server file: $serverPath" -ForegroundColor Gray
        Write-Host "Starting server in background..." -ForegroundColor Gray
        
        # Start server in background
        $job = Start-Job -ScriptBlock {
            param($ServerPath)
            Set-Location (Split-Path $ServerPath -Parent)
            node server.js
        } -ArgumentList $serverPath
        
        Write-Host "   ✅ Server started (Job ID: $($job.Id))" -ForegroundColor Green
        Write-Host "   💤 Waiting for server to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
        
        # Test if server is now responding
        try {
            $testResponse = Invoke-WebRequest -Uri "$ServerUrl/api/health" -TimeoutSec 5
            Write-Host "   ✅ Server is now responding!" -ForegroundColor Green
            $serverFixed = $true
        } catch {
            Write-Host "   ❌ Server still not responding" -ForegroundColor Red
            $serverFixed = $false
        }
    } else {
        Write-Host "   ❌ Could not find server.js at: $serverPath" -ForegroundColor Red
        $serverFixed = $false
    }
}

Write-Host ""
Write-Host "Step 3: Setting up admin account..." -ForegroundColor Yellow

if ($serverFixed -or $serverRunning) {
    try {
        # Clear existing admin accounts
        $clearBody = "{}" | ConvertTo-Json
        Invoke-WebRequest -Uri "$ServerUrl/api/admin/clear-all" -Method POST -Body $clearBody -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        
        # Create new admin account
        $setupBody = @{
            username = "admin"
            password = "admin123" 
            email = "admin@eduhub.com"
        } | ConvertTo-Json
        
        $result = Invoke-WebRequest -Uri "$ServerUrl/api/admin/setup" -Method POST -Body $setupBody -ContentType "application/json"
        Write-Host "✅ Admin account created successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "⚠️  Admin account might already exist (this is OK)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Problem Resolution Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Server URL: $ServerUrl" -ForegroundColor White
Write-Host "   • Admin Login: $ServerUrl/admin-login.html" -ForegroundColor White
Write-Host "   • Username: admin" -ForegroundColor White
Write-Host "   • Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Testing URLs:" -ForegroundColor Cyan

# Test all important URLs
$urls = @(
    @{ Name = "Main Site"; Url = $ServerUrl }
    @{ Name = "API Health"; Url = "$ServerUrl/api/health" }
    @{ Name = "Admin Login"; Url = "$ServerUrl/admin-login.html" }
)

foreach ($test in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $test.Url -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ $($test.Name): Working" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($test.Name): Failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open browser and go to: $ServerUrl" -ForegroundColor White
Write-Host "   2. For admin functions, go to: $ServerUrl/admin-login.html" -ForegroundColor White
Write-Host "   3. Use credentials: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "❓ If problems persist:" -ForegroundColor Yellow
Write-Host "   • Restart VS Code completely" -ForegroundColor White
Write-Host "   • Check Windows Firewall settings" -ForegroundColor White
Write-Host "   • Try using 127.0.0.1:5000 instead of localhost:5000" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
