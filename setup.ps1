# PowerShell Setup Script for Billing WebApp

Write-Host "🚀 Setting up Billing WebApp..." -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
    Write-Host ""
} else {
    # Check if .env.example exists
    if (!(Test-Path ".env.example")) {
        Write-Host "✗ .env.example not found!" -ForegroundColor Red
        exit 1
    }

    # Read .env.example
    $envContent = Get-Content ".env.example" -Raw

    # Generate a secure random secret
    $randomBytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($randomBytes)
    $secret = [Convert]::ToBase64String($randomBytes)

    # Replace placeholder with generated secret
    $envContent = $envContent -replace 'your-secret-key-here-generate-with-openssl-rand-base64-32', $secret

    # Write to .env
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

    Write-Host "✓ Created .env file with auto-generated NEXTAUTH_SECRET" -ForegroundColor Green
    Write-Host ""
}

# Display next steps
Write-Host "⚠️  IMPORTANT: Update DATABASE_URL in .env" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose one of these options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. FREE CLOUD DATABASE (Recommended):" -ForegroundColor Green
Write-Host "   Supabase: https://supabase.com" -ForegroundColor White
Write-Host "   - Create a project" -ForegroundColor Gray
Write-Host "   - Copy connection string from Settings → Database" -ForegroundColor Gray
Write-Host ""
Write-Host "2. LOCAL POSTGRESQL:" -ForegroundColor Green
Write-Host "   DATABASE_URL='postgresql://postgres:password@localhost:5432/billing_db'" -ForegroundColor White
Write-Host ""
Write-Host "After updating .env, run:" -ForegroundColor Cyan
Write-Host "   npm run db:push" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
