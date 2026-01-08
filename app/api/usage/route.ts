import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUsageStats } from '@/lib/usage-tracker';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId
    
    // If no tenantId, try to get from user record
    let finalTenantId = tenantId

    if (!finalTenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        finalTenantId = user.tenant.id
      } else {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Get usage stats using the utility function
    const usageStats = await getUsageStats(finalTenantId)

    // Also get actual counts for metrics that might not have usage records yet
    const admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (admin) {
      // Get actual counts
      const [productCount, billCount, cashierCount] = await Promise.all([
        prisma.product.count({ where: { adminId: admin.id } }),
        prisma.bill.count({ 
          where: { 
            adminId: admin.id,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59),
            }
          }
        }),
        prisma.billingAccount.count({ where: { adminId: admin.id } }),
      ])

      // Get subscription plan to determine limits (use actual subscription, not tenant plan)
      const subscription = await prisma.subscription.findUnique({
        where: { adminId: admin.id },
        include: { plan: true }
      })

      let planLimits: any = { products: 10, billsPerMonth: 15, users: 3, storageMB: 100 } // Default to free
      
      if (subscription && subscription.plan) {
        // Use actual subscription plan limits - ALWAYS fetch fresh plan data
        // Re-fetch subscription to ensure we have latest plan
        const freshSubscription = await prisma.subscription.findUnique({
          where: { id: subscription.id },
          include: { plan: true }
        })
        
        if (freshSubscription && freshSubscription.plan) {
          const limits = freshSubscription.plan.limits as any
          if (limits) {
            planLimits = {
              products: limits.products ?? -1,
              billsPerMonth: limits.billsPerMonth ?? -1,
              users: limits.cashierAccounts ?? -1,
              storageMB: limits.storageMB ?? 100
            }
          }
          console.log(`[Usage API] Using plan limits from subscription: Plan=${freshSubscription.plan.name}, PlanId=${freshSubscription.planId}`, planLimits)
        } else {
          console.error(`[Usage API] WARNING: Could not fetch fresh subscription plan data`)
        }
      } else {
        // Fallback to tenant plan if no subscription
        const tenant = await prisma.tenant.findUnique({
          where: { id: finalTenantId },
        })
        const plan = tenant?.plan.toLowerCase() || 'free'
        const limits: Record<string, any> = {
          free: { products: 10, billsPerMonth: 15, users: 3, storageMB: 100 },
          standard: { products: -1, billsPerMonth: -1, users: 20, storageMB: 1000 },
          professional: { products: -1, billsPerMonth: -1, users: -1, storageMB: 10000 },
        }
        planLimits = limits[plan] || limits.free
        console.log(`[Usage API] Using fallback limits from tenant plan: ${plan}`, planLimits)
      }

      // Merge usage stats with actual counts
      const result = [
        {
          metricType: 'PRODUCTS',
          currentValue: productCount,
          limitValue: planLimits.products,
        },
        {
          metricType: 'BILLS',
          currentValue: billCount,
          limitValue: planLimits.billsPerMonth,
        },
        {
          metricType: 'CASHIER_ACCOUNTS',
          currentValue: cashierCount,
          limitValue: planLimits.users, // From subscription plan
        },
        {
          metricType: 'STORAGE',
          currentValue: 0, // TODO: Calculate actual storage usage
          limitValue: planLimits.storageMB,
        },
      ]

      return NextResponse.json(result);
    }

    // Fallback to usage stats only
    return NextResponse.json(usageStats);
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
