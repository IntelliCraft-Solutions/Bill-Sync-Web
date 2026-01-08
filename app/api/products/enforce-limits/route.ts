import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Enforce product limits for free plan users
 * Called when creating/updating products to ensure limits are respected
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = session.user.id

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { adminId },
      include: { plan: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Check if on FREE_TRIAL
    const isFreePlan = subscription.plan.name === 'FREE_TRIAL' || subscription.plan.price === 0
    
    if (!isFreePlan) {
      return NextResponse.json({ 
        message: 'Not on free plan, no limits to enforce',
        canCreate: true
      })
    }

    // Get current product count
    const productCount = await prisma.product.count({
      where: { adminId }
    })

    const limit = (subscription.plan.limits as any)?.products || 10

    // Check if in grace period
    const inGracePeriod = subscription.downgradeDate && 
      new Date().getTime() - new Date(subscription.downgradeDate).getTime() < 5 * 24 * 60 * 60 * 1000

    return NextResponse.json({
      isFreePlan: true,
      productCount,
      limit,
      canCreate: productCount < limit,
      inGracePeriod: !!inGracePeriod,
      gracePeriodEnds: subscription.downgradeDate ? 
        new Date(new Date(subscription.downgradeDate).getTime() + 5 * 24 * 60 * 60 * 1000) : null,
      message: productCount >= limit ? 
        (inGracePeriod ? 
          `You have ${productCount} products. Free plan allows ${limit}. You have ${Math.ceil((5 * 24 * 60 * 60 * 1000 - (new Date().getTime() - new Date(subscription.downgradeDate!).getTime())) / (24 * 60 * 60 * 1000))} days to choose which ${limit} products to keep.` :
          `Free plan limit reached. You can have up to ${limit} products. Please upgrade to create more.`) :
        `You can create ${limit - productCount} more products.`
    })
  } catch (error: any) {
    console.error('Limit check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check limits' },
      { status: 500 }
    )
  }
}

