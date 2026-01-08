const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Finding users without Admin records...\n');

  // Get all verified users with tenants
  const users = await prisma.user.findMany({
    where: {
      emailVerified: true,
      tenantId: { not: null }
    },
    include: {
      tenant: true
    }
  });

  console.log(`Found ${users.length} verified users with tenants\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.tenant) {
      console.log(`⚠️  User ${user.email} has no tenant, skipping...`);
      skipped++;
      continue;
    }

    // Check if Admin exists
    let admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { tenantId: user.tenant.id },
          { email: user.email }
        ]
      }
    });

    if (!admin) {
      // Create Admin record
      admin = await prisma.admin.create({
        data: {
          businessName: user.tenant.name,
          email: user.email,
          password: '', // Empty password - user can set it later
          tenantId: user.tenant.id,
        }
      });
      console.log(`✅ Created Admin for ${user.email} (${user.tenant.name})`);
      created++;
    } else {
      // Check if tenantId is missing or business name needs update
      if (!admin.tenantId || admin.businessName !== user.tenant.name) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            tenantId: user.tenant.id,
            businessName: user.tenant.name,
          }
        });
        console.log(`🔄 Updated Admin for ${user.email} - linked to tenant`);
        updated++;
      } else {
        console.log(`✓ Admin already exists for ${user.email}`);
        skipped++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${users.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
