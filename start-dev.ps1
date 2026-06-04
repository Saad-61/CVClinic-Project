param(
    [string]$BackendPort = "8010",
    [string]$FrontendPort = "5173"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$pythonExe = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    throw "Could not find the virtual environment Python at $pythonExe. Create .venv in the repo root first."
}

$backendCommand = "Set-Location '$backendDir'; & '$pythonExe' -m uvicorn main:app --reload --host 127.0.0.1 --port $BackendPort"
$frontendCommand = "Set-Location '$frontendDir'; `$env:VITE_PORT='$FrontendPort'; npm run dev"

Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $backendCommand) -WorkingDirectory $backendDir
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $frontendCommand) -WorkingDirectory $frontendDir

Write-Host "Started backend on port $BackendPort and frontend on port $FrontendPort in separate PowerShell windows."