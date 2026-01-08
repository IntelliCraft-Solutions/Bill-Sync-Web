import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Force refresh subscription data - bypasses all caching
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID
    const tenantId = (session.user as any).tenantId
    let finalTenantId = tenantId

    if (!finalTenantId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true },
      })
      
      if (user?.tenant) {
        finalTenantId = user.tenant.id
      } else {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
    }

    // Get admin
    const admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Force fetch the absolute latest subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { adminId: admin.id },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          where: {
            status: {
              in: ['SUCCESS', 'PENDING', 'FAILED']
            }
          }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    console.log(`[Refresh API] Subscription: PlanId=${subscription.planId}, PlanName=${subscription.plan.name}, Price=${subscription.plan.price}`)

    return NextResponse.json({
      ...subscription,
      autoRenew: subscription.autoRenew ?? true,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh subscription' },
      { status: 500 }
    )
  }
}

