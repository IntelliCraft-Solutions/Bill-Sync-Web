const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking subscription data...\n');

  // Get all admins
  const admins = await prisma.admin.findMany({
    include: {
      subscription: {
        include: {
          plan: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      }
    }
  });

  for (const admin of admins) {
    console.log(`\n=== Admin: ${admin.email} (${admin.id}) ===`);
    
    if (admin.subscription) {
      const sub = admin.subscription;
      console.log(`Subscription ID: ${sub.id}`);
      console.log(`Plan ID: ${sub.planId}`);
      console.log(`Plan Name: ${sub.plan.name}`);
      console.log(`Plan Display Name: ${sub.plan.displayName}`);
      console.log(`Plan Price: ₹${sub.plan.price}/month`);
      console.log(`Status: ${sub.status}`);
      console.log(`Auto Renew: ${sub.autoRenew}`);
      console.log(`Payments: ${sub.payments.length}`);
      
      if (sub.payments.length > 0) {
        console.log('\nRecent Payments:');
        sub.payments.forEach((p, i) => {
          console.log(`  ${i + 1}. ₹${p.amount} - ${p.status} - ${p.createdAt.toISOString()}`);
        });
      }
    } else {
      console.log('No subscription found');
    }
  }

  // Get all plans
  console.log('\n\n=== All Available Plans ===');
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });

  plans.forEach(plan => {
    console.log(`${plan.name} (${plan.displayName}) - ₹${plan.price}/month - ID: ${plan.id}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

