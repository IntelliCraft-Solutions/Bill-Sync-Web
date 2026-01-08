import { prisma } from './prisma';

export async function getAdminSubscription(adminId: string) {
  return await prisma.subscription.findUnique({
    where: { adminId },
    include: { plan: true }
  });
}

export async function createInitialSubscription(adminId: string) {
  // Try FREE_TRIAL first, fallback to STANDARD for backward compatibility
  let freeTrialPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'FREE_TRIAL' }
  });

  if (!freeTrialPlan) {
    freeTrialPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'STANDARD', price: 0 }
    });
  }

  if (!freeTrialPlan) {
    throw new Error('Free Trial plan not found. Please seed the database.');
  }

  return await prisma.subscription.create({
    data: {
      adminId,
      planId: freeTrialPlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      isTrial: false, // Free Trial is free forever
    }
  });
}

export async function updateSubscriptionPlan(adminId: string, planName: string, paymentData?: any) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { name: planName }
  });

  if (!plan) {
    throw new Error(`Plan ${planName} not found.`);
  }

  return await prisma.subscription.update({
    where: { adminId },
    data: {
      planId: plan.id,
      status: 'ACTIVE',
      paymentMethod: paymentData?.method,
      paymentId: paymentData?.id,
      updatedAt: new Date()
    }
  });
}
