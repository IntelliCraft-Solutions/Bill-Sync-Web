import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { getISTDate, addDaysToIST } from '@/lib/date-utils'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, paymentId, signature } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify signature
    const body_signature = orderId + '|' + paymentId
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body_signature.toString())
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Fetch payment status from Razorpay
    let razorpayPayment
    try {
      razorpayPayment = await razorpay.payments.fetch(paymentId)
    } catch (err: any) {
      console.error('Failed to fetch payment from Razorpay:', err)
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }

    // Get payment from database with tenant info
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        tenant: {
          include: {
            user: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Determine status
    const isSuccess = razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized'
    const finalStatus = isSuccess ? 'SUCCESS' : (razorpayPayment.status === 'failed' ? 'FAILED' : 'PENDING')

    // CRITICAL: If payment is SUCCESS but subscription not updated, update it now
    // This is a fallback in case webhook didn't fire or failed
    if (isSuccess) {
      try {
        // Fetch order from Razorpay to get planId from notes
        let planId: string | null = null
        try {
          const order = await razorpay.orders.fetch(orderId)
          planId = order.notes?.planId as string | null
          console.log(`[Verify-Status] Fetched planId from Razorpay order: ${planId}`)
        } catch (err) {
          console.error('[Verify-Status] Failed to fetch Razorpay order:', err)
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
            console.log(`[Verify-Status] Found planId by matching amount: ${planId}`)
          }
        }

        if (planId) {
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
            console.log(`[Verify-Status] Created admin record: ${admin.id}`)
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
                paymentId: paymentId,
                downgradeDate: null,
              },
              include: { plan: true },
            })
            console.log(`[Verify-Status] Updated subscription ${subscription.id} to plan ${planId}`)
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
                paymentId: paymentId,
                autoRenew: true,
              },
              include: { plan: true },
            })
            console.log(`[Verify-Status] Created subscription ${subscription.id} with plan ${planId}`)
          }

          // Update payment with subscriptionId and ensure it's linked
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              subscriptionId: subscription.id,
              status: 'SUCCESS',
              paymentId: paymentId,
              razorpaySignature: signature,
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
            console.log(`[Verify-Status] Updated tenant plan to ${plan.name}`)
          }

          console.log(`[Verify-Status] ✅ Subscription updated successfully via fallback mechanism`)
        } else {
          console.warn(`[Verify-Status] ⚠️ Could not determine planId for payment ${payment.id}`)
        }
      } catch (subscriptionError: any) {
        console.error('[Verify-Status] Error updating subscription:', subscriptionError)
        // Don't fail the request, just log the error
      }
    }

    // Update payment in database if status changed
    if (payment.status !== finalStatus) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: finalStatus,
          paymentId: paymentId,
          razorpaySignature: signature,
          // If payment failed/pending but money was deducted, mark for refund
          refundRequested: !isSuccess && payment.status === 'PENDING' ? true : undefined,
        },
      })
    }

    return NextResponse.json({
      status: finalStatus,
      paymentId: paymentId,
      orderId: orderId,
      amount: razorpayPayment.amount / 100, // Convert from paise
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
