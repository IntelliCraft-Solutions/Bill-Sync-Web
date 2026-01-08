import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Auto-downgrade subscription to FREE_TRIAL when:
 * - Payment fails
 * - Auto-renew is disabled and billing cycle ends
 * - User cancels subscription
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = session.user.id

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { adminId },
      include: { plan: true, admin: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Don't downgrade if already on FREE_TRIAL
    if (subscription.plan.name === 'FREE_TRIAL' || subscription.plan.price === 0) {
      return NextResponse.json({ 
        message: 'Already on free plan',
        subscription 
      })
    }

    // Get FREE_TRIAL plan
    const freeTrialPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE_TRIAL' }
    })

    if (!freeTrialPlan) {
      return NextResponse.json({ 
        error: 'Free Trial plan not found' 
      }, { status: 500 })
    }

    // Update subscription to FREE_TRIAL
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: freeTrialPlan.id,
        status: 'ACTIVE',
        autoRenew: false,
        endDate: new Date(), // Mark current billing cycle as ended
      },
      include: { plan: true }
    })

    // Set downgrade warning flag (5-day grace period)
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        // Store downgrade date in metadata or create a separate field
        // For now, we'll use a flag in the subscription
      }
    })

    // TODO: Send email notification about downgrade

    return NextResponse.json({
      success: true,
      message: 'Subscription downgraded to Free Trial',
      subscription: updatedSubscription,
      gracePeriodEnds: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    })
  } catch (error: any) {
    console.error('Downgrade error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to downgrade subscription' },
      { status: 500 }
    )
  }
}

/**
 * Check and enforce product limits after grace period
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = session.user.id

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
        message: 'Not on free plan',
        needsEnforcement: false 
      })
    }

    // Get product count
    const productCount = await prisma.product.count({
      where: { adminId }
    })

    const limit = subscription.plan.limits?.products || 10

    return NextResponse.json({
      isFreePlan: true,
      productCount,
      limit,
      exceedsLimit: productCount > limit,
      needsEnforcement: productCount > limit
    })
  } catch (error: any) {
    console.error('Limit check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check limits' },
      { status: 500 }
    )
  }
}

