const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Finding accounts to clean up...\n');

  // Get all Admin records
  const admins = await prisma.admin.findMany();

  console.log(`Found ${admins.length} Admin records\n`);

  // Get all User records
  const users = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });

  console.log(`Found ${users.length} User records\n`);

  // Find Users without Admin records (orphaned users)
  const orphanedUsers = users.filter(user => {
    return !admins.some(admin => 
      admin.email === user.email || 
      (admin.tenantId && user.tenantId && admin.tenantId === user.tenantId)
    );
  });

  console.log(`Found ${orphanedUsers.length} orphaned User records (no Admin record)\n`);

  if (orphanedUsers.length === 0) {
    console.log('No orphaned users found. All users have Admin records.');
    return;
  }

  console.log('Orphaned Users:');
  orphanedUsers.forEach(user => {
    console.log(`  - ${user.email} (User ID: ${user.id}, Tenant: ${user.tenant?.name || 'N/A'})`);
  });

  console.log('\n=== Cleanup Options ===');
  console.log('These users can be safely deleted if you want to free up their emails.');
  console.log('This will delete:');
  console.log('  - User record');
  console.log('  - Tenant record (and all related data)');
  console.log('  - EmailOTP records');
  console.log('  - UsageRecords');
  console.log('  - Payments');
  console.log('  - Any other tenant-related data\n');

  // Ask for confirmation (in a real scenario, you'd use readline)
  console.log('To delete these accounts, run:');
  console.log('  node scripts/delete-orphaned-accounts.js --confirm\n');

  // List what would be deleted
  for (const user of orphanedUsers) {
    if (user.tenant) {
      const tenant = user.tenant;
      const emailOtps = await prisma.emailOTP.count({
        where: { tenantId: tenant.id }
      });
      const usageRecords = await prisma.usageRecord.count({
        where: { tenantId: tenant.id }
      });
      const payments = await prisma.payment.count({
        where: { tenantId: tenant.id }
      });

      console.log(`\n${user.email}:`);
      console.log(`  - User: ${user.id}`);
      console.log(`  - Tenant: ${tenant.id} (${tenant.name})`);
      console.log(`  - EmailOTPs: ${emailOtps}`);
      console.log(`  - UsageRecords: ${usageRecords}`);
      console.log(`  - Payments: ${payments}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
