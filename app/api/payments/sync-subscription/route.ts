import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'
import { getISTDate, addDaysToIST } from '@/lib/date-utils'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

/**
 * Sync endpoint to process successful payments that missed webhook
 * This ensures subscription is updated even if webhook failed
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        tenant: {
          include: {
            user: true
          }
        },
        subscription: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Only process if payment is SUCCESS and subscription not linked/updated
    if (payment.status !== 'SUCCESS') {
      return NextResponse.json({ 
        error: 'Payment is not successful',
        status: payment.status 
      }, { status: 400 })
    }

    // If subscription already linked and updated, skip
    if (payment.subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        include: { plan: true }
      })
      
      if (subscription && subscription.status === 'ACTIVE') {
        return NextResponse.json({ 
          message: 'Subscription already synced',
          subscriptionId: subscription.id,
          plan: subscription.plan.name
        })
      }
    }

    // Fetch order from Razorpay to get planId
    let planId: string | null = null
    try {
      const order = await razorpay.orders.fetch(orderId)
      planId = order.notes?.planId as string | null
      console.log(`[Sync] Fetched planId from Razorpay order: ${planId}`)
    } catch (err) {
      console.error('[Sync] Failed to fetch Razorpay order:', err)
    }

    // If planId not in notes, try to find by matching amount
    if (!planId) {
      const matchingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          price: payment.amount,
          isActive: true
        }
      })
      if (matchingPlan) {
        planId = matchingPlan.id
        console.log(`[Sync] Found planId by matching amount: ${planId}`)
      }
    }

    if (!planId) {
      return NextResponse.json({ 
        error: 'Could not determine plan for this payment' 
      }, { status: 400 })
    }

    // Get or create Admin record
    let admin = await prisma.admin.findFirst({
      where: { tenantId: payment.tenantId },
    })

    if (!admin) {
      admin = await prisma.admin.create({
        data: {
          businessName: payment.tenant.name,
          email: payment.tenant.user.email,
          password: '',
          tenantId: payment.tenantId,
        },
      })
      console.log(`[Sync] Created admin record: ${admin.id}`)
    }

    // Get or update subscription
    let subscription = await prisma.subscription.findUnique({
      where: { adminId: admin.id },
      include: { plan: true },
    })

    const istNow = getISTDate()
    const endDate = addDaysToIST(30) // 30 days from now

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: planId,
          status: 'ACTIVE',
          startDate: subscription.startDate, // Keep original start date
          endDate: endDate,
          paymentMethod: 'RAZORPAY',
          paymentId: payment.paymentId || '',
          downgradeDate: null,
        },
        include: { plan: true },
      })
      console.log(`[Sync] Updated subscription ${subscription.id} to plan ${planId}`)
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          adminId: admin.id,
          planId: planId,
          status: 'ACTIVE',
          startDate: istNow,
          endDate: endDate,
          paymentMethod: 'RAZORPAY',
          paymentId: payment.paymentId || '',
          autoRenew: true,
        },
        include: { plan: true },
      })
      console.log(`[Sync] Created subscription ${subscription.id} with plan ${planId}`)
    }

    // Update payment with subscriptionId
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id,
      },
    })

    // Update tenant plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (plan) {
      await prisma.tenant.update({
        where: { id: payment.tenantId },
        data: {
          plan: plan.name.toLowerCase(),
          paid: true,
          planActivatedAt: istNow,
        },
      })
      console.log(`[Sync] Updated tenant plan to ${plan.name}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      subscriptionId: subscription.id,
      plan: subscription.plan.name,
      planDisplayName: subscription.plan.displayName,
    })
  } catch (error: any) {
    console.error('[Sync] Error syncing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}
