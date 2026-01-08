const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking all payments...\n');

  const payments = await prisma.payment.findMany({
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total payments: ${payments.length}\n`);

  for (const payment of payments) {
    console.log(`\n=== Payment: ₹${payment.amount} ===`);
    console.log(`Status: ${payment.status}`);
    console.log(`Created: ${payment.createdAt.toISOString()}`);
    console.log(`Order ID: ${payment.orderId}`);
    console.log(`Payment ID: ${payment.paymentId}`);
    
    if (payment.subscription) {
      console.log(`Subscription Plan: ${payment.subscription.plan.name} (${payment.subscription.plan.displayName})`);
      console.log(`Subscription PlanId: ${payment.subscription.planId}`);
    } else {
      console.log(`No subscription linked`);
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
