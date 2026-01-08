const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');

  if (!confirm) {
    console.log('⚠️  This script will DELETE orphaned user accounts.');
    console.log('Run with --confirm flag to proceed.');
    console.log('Example: node scripts/delete-orphaned-accounts.js --confirm\n');
    process.exit(1);
  }

  console.log('Finding and deleting orphaned accounts...\n');

  // Get all Admin records
  const admins = await prisma.admin.findMany();

  // Get all User records
  const users = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });

  // Find Users without Admin records
  const orphanedUsers = users.filter(user => {
    return !admins.some(admin => 
      admin.email === user.email || 
      (admin.tenantId && user.tenantId && admin.tenantId === user.tenantId)
    );
  });

  console.log(`Found ${orphanedUsers.length} orphaned User records to delete\n`);

  if (orphanedUsers.length === 0) {
    console.log('No orphaned users found.');
    return;
  }

  let deleted = 0;
  let errors = 0;

  for (const user of orphanedUsers) {
    try {
      if (user.tenant) {
        // Delete tenant (this will cascade delete related records)
        await prisma.tenant.delete({
          where: { id: user.tenant.id }
        });
        console.log(`✅ Deleted tenant ${user.tenant.id} (${user.tenant.name})`);
      }

      // Delete user
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`✅ Deleted user ${user.email} (${user.id})`);
      deleted++;
    } catch (error) {
      console.error(`❌ Error deleting ${user.email}:`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${orphanedUsers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
