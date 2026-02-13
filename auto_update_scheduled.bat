@echo off
chcp 65001 >nul
echo ===================================================
echo   Scheduled Auto Update Starting...
echo ===================================================
echo.

cd /d "%~dp0"

:: Auto-run option 4 (Auto Update)
echo   [Auto Update Mode - 30 Days]
echo   Collecting videos for the last 30 days...
call node scripts/fetch_videos.js 30

echo.
echo   Deploying to GitHub...
git add .

:: Check if there are changes to commit
git diff-index --quiet HEAD
if %ERRORLEVEL% NEQ 0 (
    echo   📝 Changes detected, committing...
    git commit -m "Scheduled Auto-update: %date% %time%"
    git push origin main
    echo   ✅ Deployment Completed!
) else (
    echo   ℹ️  No changes detected, skipping deployment.
)

echo.
echo ===================================================
echo   Scheduled Update Complete!
echo   Servers will NOT start (background task mode)
echo ===================================================
timeout /t 5
exit
