const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running pre-development setup...\n');

// Step 1: Generate Prisma Client
console.log('🔧 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  // Check if it's a file lock error (dev server running)
  const errorMessage = error.message || error.toString() || '';
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
  const fullError = errorMessage + errorOutput;
  
  if (fullError.includes('EPERM') || fullError.includes('operation not permitted')) {
    console.log('⚠️  Prisma Client already in use (dev server may be running)');
    console.log('💡 Tip: Stop the dev server, run "npx prisma generate" manually, then restart');
    console.log('✅ Continuing with existing Prisma Client\n');
  } else {
    console.error('❌ Failed to generate Prisma Client');
    console.error(errorMessage || error);
    // Don't exit - allow dev server to start anyway if Prisma Client exists
    console.log('⚠️  Continuing anyway...\n');
  }
}

// Step 2: Push database schema
console.log('🗄️  Syncing database schema...');
try {
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Database schema synced\n');
} catch (error) {
  // Check if it's a file lock error or already in sync
  const errorMessage = error.message || error.toString() || '';
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
  const fullError = errorMessage + errorOutput;
  
  if (fullError.includes('EPERM') || fullError.includes('operation not permitted')) {
    console.log('⚠️  Prisma Client already in use (dev server may be running)');
    console.log('✅ Continuing with existing database schema\n');
  } else if (fullError.includes('already in sync')) {
    console.log('✅ Database already in sync\n');
  } else {
    console.error('❌ Failed to sync database schema');
    console.error(errorMessage || error);
    // Don't exit - allow dev server to start anyway
    console.log('⚠️  Continuing anyway...\n');
  }
}

console.log('✨ Pre-development setup complete!\n');
console.log('🚀 Starting development server...\n');
