const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'STANDARD',
      displayName: 'Standard',
      price: 0,
      currency: 'INR',
      features: [
        'Up to 50 products',
        'Up to 100 bills/month',
        '1 admin account',
        '3 cashier accounts',
        'Basic reports',
        'Email support'
      ],
      limits: {
        products: 50,
        billsPerMonth: 100,
        adminAccounts: 1,
        cashierAccounts: 3,
        storageMB: 100
      }
    },
    {
      name: 'PROFESSIONAL',
      displayName: 'Professional',
      price: 1499,
      currency: 'INR',
      features: [
        'Unlimited products',
        'Unlimited bills',
        'Up to 5 admin accounts',
        'Up to 20 cashier accounts',
        'Advanced reports & analytics',
        'Priority email support',
        'Custom branding',
        '1GB storage'
      ],
      limits: {
        products: -1,
        billsPerMonth: -1,
        adminAccounts: 5,
        cashierAccounts: 20,
        storageMB: 1000
      }
    },
    {
      name: 'PREMIUM',
      displayName: 'Premium',
      price: 2999,
      currency: 'INR',
      features: [
        'Everything in Professional',
        'Unlimited admin accounts',
        'Unlimited cashier accounts',
        'API access',
        'White-label option',
        'Phone support',
        'Custom integrations',
        '10GB storage'
      ],
      limits: {
        products: -1,
        billsPerMonth: -1,
        adminAccounts: -1,
        cashierAccounts: -1,
        storageMB: 10000
      }
    }
  ];

  console.log('Seeding subscription plans...');

  for (const planData of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: planData.name }
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: planData
      });
      console.log(`Updated plan: ${planData.name}`);
    } else {
      await prisma.subscriptionPlan.create({
        data: planData
      });
      console.log(`Created plan: ${planData.name}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
