const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running pre-development setup...\n');

// Step 1: Create uploads directory
console.log('📁 Creating uploads directory...');
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created: public/uploads\n');
} else {
  console.log('✅ Already exists: public/uploads\n');
}

// Step 2: Generate Prisma Client
console.log('🔧 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  // Check if it's a file lock error (dev server running)
  if (error.message && error.message.includes('EPERM')) {
    console.log('⚠️  Prisma Client already in use (dev server may be running)');
    console.log('✅ Continuing with existing Prisma Client\n');
  } else {
    console.error('❌ Failed to generate Prisma Client');
    console.error(error.message);
    process.exit(1);
  }
}

// Step 3: Push database schema
console.log('🗄️  Syncing database schema...');
try {
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Database schema synced\n');
} catch (error) {
  // Check if it's a file lock error or already in sync
  const errorMsg = error.message || '';
  if (errorMsg.includes('EPERM')) {
    console.log('⚠️  Prisma Client already in use (dev server may be running)');
    console.log('✅ Continuing with existing database schema\n');
  } else if (errorMsg.includes('already in sync')) {
    console.log('✅ Database already in sync\n');
  } else {
    console.error('❌ Failed to sync database schema');
    console.error(errorMsg);
    // Don't exit - allow dev server to start anyway
    console.log('⚠️  Continuing anyway...\n');
  }
}

console.log('✨ Pre-development setup complete!\n');
console.log('🚀 Starting development server...\n');
