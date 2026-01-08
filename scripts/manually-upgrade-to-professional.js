const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Manually upgrading subscriptions to PROFESSIONAL...\n');

  // Get PROFESSIONAL plan
  const professionalPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'PROFESSIONAL' }
  });

  if (!professionalPlan) {
    console.error('PROFESSIONAL plan not found!');
    return;
  }

  console.log(`PROFESSIONAL plan: ${professionalPlan.id} (${professionalPlan.displayName}) - ₹${professionalPlan.price}/month\n`);

  // Get all payments of ₹2999
  const payments = await prisma.payment.findMany({
    where: {
      amount: 2999
    },
    include: {
      tenant: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${payments.length} payments of ₹2999\n`);

  for (const payment of payments) {
    console.log(`\n=== Processing payment: ₹${payment.amount} (${payment.status}) ===`);
    console.log(`Tenant: ${payment.tenant.name} (${payment.tenantId})`);
    console.log(`Order ID: ${payment.orderId}`);
    console.log(`Created: ${payment.createdAt.toISOString()}`);

    // Find admin for this tenant
    const admin = await prisma.admin.findFirst({
      where: { tenantId: payment.tenantId }
    });

    if (!admin) {
      console.log(`⚠️  No admin found for tenant ${payment.tenantId}`);
      continue;
    }

    console.log(`Admin: ${admin.email} (${admin.id})`);

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { adminId: admin.id },
      include: { plan: true }
    });

    if (subscription) {
      console.log(`Current subscription: ${subscription.plan.name} (${subscription.plan.displayName})`);
      
      // Update to PROFESSIONAL
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: professionalPlan.id,
          status: 'ACTIVE'
        },
        include: {
          plan: true
        }
      });
      
      console.log(`✅ Updated subscription to: ${subscription.plan.name} (${subscription.plan.displayName})`);
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          adminId: admin.id,
          planId: professionalPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        include: {
          plan: true
        }
      });
      
      console.log(`✅ Created new subscription: ${subscription.plan.name} (${subscription.plan.displayName})`);
    }

    // Update payment status to SUCCESS and link to subscription
    if (payment.status !== 'SUCCESS') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          subscriptionId: subscription.id
        }
      });
      console.log(`✅ Updated payment status to SUCCESS and linked to subscription`);
    } else if (!payment.subscriptionId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          subscriptionId: subscription.id
        }
      });
      console.log(`✅ Linked payment to subscription`);
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
