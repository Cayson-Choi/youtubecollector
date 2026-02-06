@echo off
echo ===================================================
echo   AI Insight Collector
echo ===================================================

:: 1. Start Servers
echo [1/3] Starting API Server...
start "AI_API_Server" node server.js

echo [2/3] Starting Frontend Server...
start "AI_Frontend" npm run dev

timeout /t 3 >nul

:: 2. Open Browser
echo [3/3] Opening Browser...
timeout /t 2 >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Done! Servers are running in the background.
echo   Use the Settings button in the web UI to manage channels.
echo   Do not close this window!
echo ===================================================
pause
