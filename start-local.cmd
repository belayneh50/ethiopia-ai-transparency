@echo off
title Ethiopia AI Transparency - Local Server
cd /d "%~dp0"
echo Starting Ethiopia AI Transparency...
echo Keep this window open while using the app.
echo Your browser will open automatically when the site is ready.
echo.
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$url='http://localhost:5173'; for ($i=0; $i -lt 90; $i++) { try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if ($response.StatusCode -ge 200) { Start-Process $url; exit } } catch {}; Start-Sleep -Seconds 1 }"
corepack pnpm dev
echo.
echo The local server stopped. Press any key to close this window.
pause >nul
