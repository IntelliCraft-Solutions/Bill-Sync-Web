@echo off
echo.
echo ========================================
echo  Billing WebApp - Quick Setup
echo ========================================
echo.

REM Check if .env exists
if exist ".env" (
    echo [OK] .env file already exists
    echo.
    goto :instructions
)

REM Check if .env.example exists
if not exist ".env.example" (
    echo [ERROR] .env.example not found!
    pause
    exit /b 1
)

REM Copy .env.example to .env
copy .env.example .env >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [OK] Created .env file
    echo.
) else (
    echo [ERROR] Failed to create .env file
    pause
    exit /b 1
)

:instructions
echo NEXT STEPS:
echo.
echo 1. Open .env file and update DATABASE_URL
echo.
echo 2. Get a FREE database from:
echo    - Supabase: https://supabase.com
echo    - Railway: https://railway.app  
echo    - Neon: https://neon.tech
echo.
echo 3. After updating .env, run:
echo    npm run db:push
echo    npm run dev
echo.
echo See ERROR_FIXES.md for detailed instructions
echo.
pause
