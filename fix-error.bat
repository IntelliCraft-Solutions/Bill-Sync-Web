@echo off
echo.
echo ========================================
echo  Fixing "Internal Server Error"
echo ========================================
echo.

echo Step 1: Generating secure NEXTAUTH_SECRET...
echo.
node generate-secret.js

echo.
echo ========================================
echo IMPORTANT: Copy the secret above
echo ========================================
echo.
echo 1. Open .env file
echo 2. Find: NEXTAUTH_SECRET="..."
echo 3. Replace with the secret shown above
echo 4. Save the file
echo 5. Restart the server: npm run dev
echo.
echo See FIX_INTERNAL_ERROR.md for detailed instructions
echo.
pause
