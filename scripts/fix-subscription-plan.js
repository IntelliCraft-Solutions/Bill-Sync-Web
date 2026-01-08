const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking and fixing subscription plans...\n');

  // Get PROFESSIONAL plan
  const professionalPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'PROFESSIONAL' }
  });

  if (!professionalPlan) {
    console.error('PROFESSIONAL plan not found!');
    return;
  }

  console.log(`PROFESSIONAL plan found: ${professionalPlan.id} (${professionalPlan.displayName}) - ₹${professionalPlan.price}/month\n`);

  // Get all subscriptions with STANDARD plan
  const subscriptions = await prisma.subscription.findMany({
    where: {
      plan: {
        name: 'STANDARD'
      }
    },
    include: {
      plan: true,
      payments: {
        where: {
          status: 'SUCCESS'
        },
        orderBy: { createdAt: 'desc' }
      },
      admin: true
    }
  });

  console.log(`Found ${subscriptions.length} STANDARD subscriptions to check...\n`);

  for (const sub of subscriptions) {
    console.log(`\n=== Admin: ${sub.admin.email} ===`);
    console.log(`Current Plan: ${sub.plan.name} (${sub.plan.displayName}) - ₹${sub.plan.price}/month`);
    console.log(`Payments >= ₹2999: ${sub.payments.length}`);
    
    if (sub.payments.length > 0) {
      console.log(`Latest payment: ₹${sub.payments[0].amount} on ${sub.payments[0].createdAt.toISOString()}`);
      
      // Update to PROFESSIONAL
      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: professionalPlan.id
        },
        include: {
          plan: true
        }
      });
      
      console.log(`✅ Updated to: ${updated.plan.name} (${updated.plan.displayName}) - ₹${updated.plan.price}/month`);
    } else {
      console.log(`⚠️  No qualifying payments found`);
    }
  }

  // Also check for any subscriptions that should be PROFESSIONAL based on recent payments
  const allPayments = await prisma.payment.findMany({
    where: {
      status: 'SUCCESS',
      amount: { gte: 2999 }
    },
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n\n=== Checking all payments >= ₹2999 ===`);
  for (const payment of allPayments) {
    if (payment.subscription && payment.subscription.plan.name !== 'PROFESSIONAL') {
      console.log(`\nPayment: ₹${payment.amount} on ${payment.createdAt.toISOString()}`);
      console.log(`Subscription: ${payment.subscription.plan.name} (should be PROFESSIONAL)`);
      
      const updated = await prisma.subscription.update({
        where: { id: payment.subscription.id },
        data: {
          planId: professionalPlan.id
        },
        include: {
          plan: true
        }
      });
      
      console.log(`✅ Updated to: ${updated.plan.name}`);
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
