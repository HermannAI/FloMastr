# PowerShell Command Reference for FloMastr

## ⚠️ CRITICAL REMINDER FOR AI ASSISTANTS
**ALWAYS use proper PowerShell syntax when working in Windows PowerShell environment!**

## Common Command Syntax Issues

### ❌ WRONG - Unix/curl syntax
```bash
curl -X GET "http://localhost:8000/health" -H "Accept: application/json"
```

### ✅ CORRECT - PowerShell syntax
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -Headers @{"Accept"="application/json"}
```

## Backend Testing Commands

### Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET
```

### POST Request with JSON Body
```powershell
$headers = @{"Content-Type"="application/json"}
$body = @{
    tenant_slug = "test-company"
    owner_email = "admin@test.com"
    tenant_name = "Test Company"
    n8n_url = "https://test.n8n.flomastr.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/routes/api/v1/admin/tenants/provision" -Method POST -Headers $headers -Body $body
```

### GET Request with Headers
```powershell
$headers = @{"Accept"="application/json"; "Authorization"="Bearer token"}
Invoke-WebRequest -Uri "http://localhost:8000/routes/tenants" -Method GET -Headers $headers
```

## Backend Startup Commands

### Start Backend (Proper way)
```powershell
cd C:\Users\Hp\FloMastr\backend
.\start-backend.ps1
```

### Check if Backend is Running
```powershell
netstat -ano | findstr :8000
```

### Environment Variable Setting
```powershell
$env:DATABASE_URL = "postgresql://..."
```

## File Operations

### Check if File Exists
```powershell
Test-Path "filename.py"
```

### List Directory Contents
```powershell
Get-ChildItem "C:\path\to\directory"
```

### Navigate to Directory
```powershell
Set-Location "C:\path\to\directory"
# OR
cd "C:\path\to\directory"
```

## Process Management

### Find Process on Port
```powershell
netstat -ano | findstr :8000
```

### Kill Process by PID
```powershell
Stop-Process -Id 12345 -Force
```

## JSON Handling in PowerShell

### Create JSON Body
```powershell
$jsonBody = @{
    key1 = "value1"
    key2 = "value2"
    nested = @{
        subkey = "subvalue"
    }
} | ConvertTo-Json -Depth 3
```

### Parse JSON Response
```powershell
$response = Invoke-WebRequest -Uri "..." -Method GET
$data = $response.Content | ConvertFrom-Json
```

## Key Differences to Remember

| Operation | ❌ Unix/curl | ✅ PowerShell |
|-----------|-------------|---------------|
| HTTP GET | `curl -X GET` | `Invoke-WebRequest -Method GET` |
| Headers | `-H "Key: Value"` | `-Headers @{"Key"="Value"}` |
| JSON Body | `-d '{"key":"value"}'` | `-Body ($object \| ConvertTo-Json)` |
| File Check | `test -f file` | `Test-Path "file"` |
| Directory | `ls` | `Get-ChildItem` |
| Environment | `export VAR=value` | `$env:VAR = "value"` |

## FloMastr-Specific Commands

### Start Backend (All-in-One)
```powershell
cd C:\Users\Hp\FloMastr\backend; .\start-backend.ps1
```

### Quick Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET | Select-Object StatusCode, Content
```

### Test Database Connection
```powershell
cd C:\Users\Hp\FloMastr\backend
python test_db_connection.py
```

---

**🎯 REMEMBER: When in doubt, use `Invoke-WebRequest` instead of `curl` in PowerShell!**
