const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting subscription migration...');

  // Step 1: Update existing STANDARD plans (price 0) to FREE_TRIAL
  const freeTrialPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'FREE_TRIAL' }
  });

  if (!freeTrialPlan) {
    console.error('FREE_TRIAL plan not found. Please run seed-plans.js first.');
    process.exit(1);
  }

  // Find all subscriptions with STANDARD plan (price 0)
  const standardPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'STANDARD', price: 0 }
  });

  if (standardPlan) {
    // Update all subscriptions from old STANDARD to FREE_TRIAL
    const updated = await prisma.subscription.updateMany({
      where: { planId: standardPlan.id },
      data: { planId: freeTrialPlan.id }
    });
    console.log(`Updated ${updated.count} subscriptions from STANDARD (free) to FREE_TRIAL`);

    // Delete the old STANDARD plan if it has price 0
    await prisma.subscriptionPlan.delete({
      where: { id: standardPlan.id }
    });
    console.log('Deleted old STANDARD plan (price 0)');
  }

  // Step 2: Update any subscriptions that might still reference old plan names
  const allSubscriptions = await prisma.subscription.findMany({
    include: { plan: true }
  });

  for (const sub of allSubscriptions) {
    // If subscription has STANDARD plan with price 0, update to FREE_TRIAL
    if (sub.plan.name === 'STANDARD' && sub.plan.price === 0) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { planId: freeTrialPlan.id }
      });
      console.log(`Updated subscription ${sub.id} to FREE_TRIAL`);
    }
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

