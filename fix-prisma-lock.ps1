# Fix Prisma Client Generation Lock Issue
# Run this script as Administrator if needed

Write-Host "🔧 Fixing Prisma Client generation lock issue..." -ForegroundColor Cyan

$prismaPath = "node_modules\.prisma\client"

# Check if the file exists
if (Test-Path "$prismaPath\query_engine-windows.dll.node") {
    Write-Host "📁 Found existing Prisma Client file" -ForegroundColor Yellow
    
    # Try to remove the file
    try {
        Remove-Item "$prismaPath\query_engine-windows.dll.node" -Force -ErrorAction Stop
        Write-Host "✅ Removed locked file" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not remove file: $_" -ForegroundColor Red
        Write-Host "💡 Try closing any programs that might be using this file:" -ForegroundColor Yellow
        Write-Host "   - VS Code / Cursor" -ForegroundColor Yellow
        Write-Host "   - Windows Explorer (close the folder)" -ForegroundColor Yellow
        Write-Host "   - Antivirus (temporarily disable)" -ForegroundColor Yellow
        Write-Host "   - Or run this script as Administrator" -ForegroundColor Yellow
        exit 1
    }
}

# Remove any temp files
Get-ChildItem "$prismaPath\*.tmp*" -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Host "🔄 Now generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Generation failed. Try running as Administrator or check antivirus." -ForegroundColor Red
}

