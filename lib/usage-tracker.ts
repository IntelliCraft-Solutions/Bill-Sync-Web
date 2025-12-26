import { prisma } from './prisma';
import { getLimit, MetricType } from './limits';

export async function checkUsageLimit(adminId: string, metricType: MetricType) {
  const subscription = await prisma.subscription.findUnique({
    where: { adminId },
    include: { plan: true }
  });

  if (!subscription) {
    // If no subscription, assume STANDARD plan for now or return false
    return { exceeded: true, message: 'No active subscription found.' };
  }

  const limit = getLimit(subscription.plan.name, metricType);
  
  if (limit === -1) return { exceeded: false };

  const usage = await prisma.usageRecord.findFirst({
    where: {
      adminId,
      metricType,
      periodStart: { lte: new Date() },
      periodEnd: { gte: new Date() }
    }
  });

  const currentUsage = usage?.currentValue || 0;

  if (currentUsage >= limit) {
    return {
      exceeded: true,
      currentUsage,
      limit,
      message: `You have reached the limit for ${metricType.toLowerCase().replace('_', ' ')} on your ${subscription.plan.displayName} plan.`
    };
  }

  return { exceeded: false, currentUsage, limit };
}

export async function incrementUsage(adminId: string, metricType: MetricType, amount = 1) {
  const subscription = await prisma.subscription.findUnique({
    where: { adminId }
  });

  if (!subscription) return;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await prisma.usageRecord.findFirst({
    where: {
      adminId,
      metricType,
      periodStart: { lte: now },
      periodEnd: { gte: now }
    }
  });

  if (usage) {
    await prisma.usageRecord.update({
      where: { id: usage.id },
      data: { currentValue: { increment: amount } }
    });
  } else {
    // Need to get limit from plan
    const subWithPlan = await prisma.subscription.findUnique({
      where: { adminId },
      include: { plan: true }
    });
    
    if (!subWithPlan) return;

    await prisma.usageRecord.create({
      data: {
        adminId,
        subscriptionId: subWithPlan.id,
        metricType,
        currentValue: amount,
        limitValue: getLimit(subWithPlan.plan.name, metricType),
        periodStart,
        periodEnd
      }
    });
  }
}
