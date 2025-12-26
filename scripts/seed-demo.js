const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('demo_password_123', 10);
  
  const demoAdmin = await prisma.admin.upsert({
    where: { email: 'demo@bill-sync.com' },
    update: {},
    create: {
      email: 'demo@bill-sync.com',
      password: hashedPassword,
      businessName: 'Demo Business',
    },
  });

  console.log('Demo admin created:', demoAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
