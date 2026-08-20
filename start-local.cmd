@echo off
title Ethiopia AI Transparency - Local Server
cd /d "%~dp0"
echo Starting Ethiopia AI Transparency...
echo Keep this window open while using the app.
echo.
corepack pnpm dev
echo.
echo The local server stopped. Press any key to close this window.
pause >nul
