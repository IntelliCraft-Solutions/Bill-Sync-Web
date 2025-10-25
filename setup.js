const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Create .env file from .env.example
const setupEnv = () => {
  const envExamplePath = path.join(__dirname, '.env.example');
  const envPath = path.join(__dirname, '.env');

  if (fs.existsSync(envPath)) {
    console.log('✓ .env file already exists');
    return;
  }

  if (!fs.existsSync(envExamplePath)) {
    console.error('✗ .env.example not found');
    process.exit(1);
  }

  // Read .env.example
  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Replace the placeholder secret with a real one
  const secret = generateSecret();
  envContent = envContent.replace(
    'your-secret-key-here-generate-with-openssl-rand-base64-32',
    secret
  );

  // Write to .env
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Created .env file with auto-generated NEXTAUTH_SECRET');
  console.log('');
  console.log('⚠️  IMPORTANT: Update DATABASE_URL in .env with your PostgreSQL credentials');
  console.log('');
  console.log('Example for local PostgreSQL:');
  console.log('DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/billing_db?schema=public"');
  console.log('');
  console.log('Or use a free cloud database:');
  console.log('- Supabase: https://supabase.com (Free tier available)');
  console.log('- Railway: https://railway.app (Easy setup)');
  console.log('- Neon: https://neon.tech (Serverless Postgres)');
};

setupEnv();
