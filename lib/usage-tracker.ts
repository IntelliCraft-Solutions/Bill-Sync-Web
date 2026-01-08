import { prisma } from './prisma'

export type MetricType = 'PRODUCTS' | 'BILLS' | 'STORAGE' | 'USERS' | 'API_CALLS'

interface QuotaPolicy {
  products: number
  billsPerMonth: number
  storageMB: number
  users: number
  apiCalls: number
}

const QUOTA_POLICIES: Record<string, QuotaPolicy> = {
  free: {
    products: 10,
    billsPerMonth: 15,
    storageMB: 100,
    users: 3, // 3 cashiers allowed in free plan
    apiCalls: 1000,
  },
  pro: {
    products: -1, // unlimited
    billsPerMonth: -1,
    storageMB: 1000,
    users: 5,
    apiCalls: 50000,
  },
  premium: {
    products: -1,
    billsPerMonth: -1,
    storageMB: 10000,
    users: -1,
    apiCalls: -1,
  },
}

function getMetricKey(metricType: MetricType): keyof QuotaPolicy {
  switch (metricType) {
    case 'PRODUCTS':
      return 'products'
    case 'BILLS':
      return 'billsPerMonth'
    case 'STORAGE':
      return 'storageMB'
    case 'USERS':
      return 'users'
    case 'API_CALLS':
      return 'apiCalls'
    default:
      return 'products'
  }
}

export async function checkQuota(
  tenantId: string,
  metricType: MetricType,
  amount: number = 1
): Promise<{ allowed: boolean; error?: string; usage?: number; limit?: number }> {
  try {
    // Get tenant with plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return { allowed: false, error: 'Tenant not found' }
    }

    const plan = tenant.plan.toLowerCase()
    const policy = QUOTA_POLICIES[plan] || QUOTA_POLICIES.free
    const metricKey = getMetricKey(metricType)
    const limit = policy[metricKey]

    // Unlimited
    if (limit === -1) {
      return { allowed: true, usage: 0, limit: -1 }
    }

    // Special handling for USERS (cashiers) - check actual count, not usage record
    if (metricType === 'USERS') {
      const admin = await prisma.admin.findFirst({
        where: { tenantId },
      })

      if (!admin) {
        return { allowed: false, error: 'Admin not found' }
      }

      const currentCount = await prisma.billingAccount.count({
        where: { adminId: admin.id },
      })

      if (currentCount + amount > limit) {
        return {
          allowed: false,
          error: `Free plan limit reached. You can have up to ${limit} cashier accounts. Upgrade to continue.`,
          usage: currentCount,
          limit,
        }
      }

      // Update usage record for tracking (but use actual count)
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      let usageRecord = await prisma.usageRecord.findFirst({
        where: {
          tenantId,
          metricType,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
      })

      if (!usageRecord) {
        usageRecord = await prisma.usageRecord.create({
          data: {
            tenantId,
            metricType,
            currentValue: currentCount,
            limitValue: limit,
            period: 'MONTHLY',
            periodStart,
            periodEnd,
          },
        })
      } else {
        // Sync usage record with actual count
        await prisma.usageRecord.update({
          where: { id: usageRecord.id },
          data: { currentValue: currentCount },
        })
      }

      return {
        allowed: true,
        usage: currentCount + amount,
        limit,
      }
    }

    // For other metrics, use usage records
    // Get current period (monthly)
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get or create usage record
    let usageRecord = await prisma.usageRecord.findFirst({
      where: {
        tenantId,
        metricType,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    })

    if (!usageRecord) {
      usageRecord = await prisma.usageRecord.create({
        data: {
          tenantId,
          metricType,
          currentValue: 0,
          limitValue: limit,
          period: 'MONTHLY',
          periodStart,
          periodEnd,
        },
      })
    }

    // Check if adding amount would exceed limit
    if (usageRecord.currentValue + amount > limit) {
      return {
        allowed: false,
        error: `Free plan limit reached. Upgrade to continue.`,
        usage: usageRecord.currentValue,
        limit,
      }
    }

    // Increment usage
    await prisma.usageRecord.update({
      where: { id: usageRecord.id },
      data: { currentValue: { increment: amount } },
    })

    return {
      allowed: true,
      usage: usageRecord.currentValue + amount,
      limit,
    }
  } catch (error: any) {
    console.error('Quota check error:', error)
    return { allowed: false, error: 'Failed to check quota' }
  }
}

export async function getUsageStats(tenantId: string) {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const usageRecords = await prisma.usageRecord.findMany({
    where: {
      tenantId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
  })

  return usageRecords.map((record) => ({
    metric: record.metricType,
    current: record.currentValue,
    limit: record.limitValue,
    percentage: record.limitValue === -1 ? 0 : (record.currentValue / record.limitValue) * 100,
  }))
}
