import { prisma } from './prisma';

export async function getAdminSubscription(adminId: string) {
  return await prisma.subscription.findUnique({
    where: { adminId },
    include: { plan: true }
  });
}

export async function createInitialSubscription(adminId: string) {
  const standardPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'STANDARD' }
  });

  if (!standardPlan) {
    throw new Error('Standard plan not found. Please seed the database.');
  }

  return await prisma.subscription.create({
    data: {
      adminId,
      planId: standardPlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      isTrial: false, // Standard is free forever
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
