@echo off
chcp 65001 >nul
echo ===================================================
echo   Setting up Scheduled Auto-Update Tasks
echo ===================================================
echo.
echo   This will create 2 scheduled tasks:
echo   - Task 1: Every day at 09:00 AM
echo   - Task 2: Every day at 18:00 PM (6:00 PM)
echo.
pause

:: Get current directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_PATH=%SCRIPT_DIR%auto_update_scheduled.bat"

:: Create Task 1 - 9 AM
echo.
echo [1/2] Creating morning task (09:00)...
schtasks /Create /TN "AI_Collector_Update_Morning" /TR "\"%SCRIPT_PATH%\"" /SC DAILY /ST 09:00 /F
if %ERRORLEVEL% EQU 0 (
    echo ✅ Morning task created successfully!
) else (
    echo ❌ Failed to create morning task. Please run as Administrator.
)

:: Create Task 2 - 6 PM
echo.
echo [2/2] Creating evening task (18:00)...
schtasks /Create /TN "AI_Collector_Update_Evening" /TR "\"%SCRIPT_PATH%\"" /SC DAILY /ST 18:00 /F
if %ERRORLEVEL% EQU 0 (
    echo ✅ Evening task created successfully!
) else (
    echo ❌ Failed to create evening task. Please run as Administrator.
)

echo.
echo ===================================================
echo   Setup Complete!
echo ===================================================
echo.
echo   Your scheduled tasks:
echo   - Morning: 09:00 (9 AM)
echo   - Evening: 18:00 (6 PM)
echo.
echo   To view/modify tasks:
echo   1. Press Win+R
echo   2. Type: taskschd.msc
echo   3. Find: AI_Collector_Update_Morning/Evening
echo.
echo   To remove tasks, run: uninstall_scheduler.bat
echo ===================================================
pause
