@echo off
chcp 65001 >nul
echo ===================================================
echo   Removing Scheduled Auto-Update Tasks
echo ===================================================
echo.
echo   This will remove all scheduled tasks.
echo.
pause

echo.
echo [1/2] Removing morning task...
schtasks /Delete /TN "AI_Collector_Update_Morning" /F
if %ERRORLEVEL% EQU 0 (
    echo ✅ Morning task removed.
) else (
    echo ⚠️  Morning task not found or already removed.
)

echo.
echo [2/2] Removing evening task...
schtasks /Delete /TN "AI_Collector_Update_Evening" /F
if %ERRORLEVEL% EQU 0 (
    echo ✅ Evening task removed.
) else (
    echo ⚠️  Evening task not found or already removed.
)

echo.
echo ===================================================
echo   Cleanup Complete!
echo ===================================================
pause
