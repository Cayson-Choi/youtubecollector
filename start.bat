@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:MENU
cls
echo ===================================================
echo   Trending AI Insights - Integrated Launcher
echo ===================================================
echo.
echo   1. [Just Start] Start Servers ^& Open Browser
echo   2. [Update] Collect Videos, Deploy, then Start
echo   3. [Channel] Manage Channels (Add/Remove)
echo   4. [Auto Update] 30days Auto-Collect ^& Deploy ^& Start
echo   5. [Exit] Close
echo.
set /p CHOICE="Choose an option (1-5): "

if "%CHOICE%"=="1" goto START_SERVERS
if "%CHOICE%"=="2" goto COLLECT_DEPLOY
if "%CHOICE%"=="3" goto MANAGE_CHANNELS
if "%CHOICE%"=="4" goto AUTO_UPDATE
if "%CHOICE%"=="5" goto EOF

goto MENU

:MANAGE_CHANNELS
call node scripts/manage_channels.js
goto MENU

:AUTO_UPDATE
echo.
echo ---------------------------------------------------
echo   [Auto Update Mode - 30 Days]
echo ---------------------------------------------------
echo   Automatically collecting videos, deploying, and starting...
echo.

set DAYS=30
echo   Collecting videos for the last %DAYS% days...
call node scripts/fetch_videos.js %DAYS%

echo.
echo   Deploying to GitHub...
git add .
git commit -m "Auto-update: %date% %time%"
git push origin main
echo   ✅ Deployment Completed!

echo.
echo   Starting servers...
timeout /t 2 >nul
goto START_SERVERS

:COLLECT_DEPLOY
echo.
echo ---------------------------------------------------
echo   [Step 1] Data Collection
echo ---------------------------------------------------
set /p DAYS="Enter days to look back (default 30): "
if "%DAYS%"=="" set DAYS=30

echo.
echo   Collecting videos for the last %DAYS% days...
call node scripts/fetch_videos.js %DAYS%

echo.
echo ---------------------------------------------------
echo   [Step 2] Deployment
echo ---------------------------------------------------
set /p DEPLOY="Do you want to deploy to GitHub? (Y/N): "
if /i "%DEPLOY%"=="Y" (
    echo.
    echo   Deploying updates...
    git add .
    git commit -m "Auto-update: %date% %time%"
    git push origin main
    echo   ✅ Deployment Completed!
) else (
    echo   Skipping deployment.
)

echo.
echo   Data update finished. Starting servers...
timeout /t 2 >nul
goto START_SERVERS

:START_SERVERS
cls
echo ===================================================
echo   Starting Trending AI Insights...
echo ===================================================
echo.

:: 1. Start API Server (Background)
echo [1/3] Starting API Server...
start "AI_API_Server" node server.js

:: 2. Start Frontend Server (Background)
echo [2/3] Starting Frontend Server...
start "AI_Frontend" npm run dev

timeout /t 3 >nul

:: 3. Open Browser
echo [3/3] Opening Browser...
timeout /t 2 >nul
start http://localhost:5176

echo.
echo ===================================================
echo   Done! Servers are running.
echo   - API: http://localhost:3002
echo   - Web: http://localhost:5176
echo   Do not close this window!
echo ===================================================
pause

:EOF
exit
