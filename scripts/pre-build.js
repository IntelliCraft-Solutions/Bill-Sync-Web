const { execSync } = require('child_process');
const path = require('path');

console.log('🏗️  Running pre-build setup...\n');

// Step 1: Generate Prisma Client
console.log('🔧 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

// Step 2: Push database schema (for production deployment)
console.log('🗄️  Syncing database schema...');
try {
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Database schema synced\n');
} catch (error) {
  console.error('❌ Failed to sync database schema');
  process.exit(1);
}

console.log('✨ Pre-build setup complete!\n');
console.log('🏗️  Starting build process...\n');
