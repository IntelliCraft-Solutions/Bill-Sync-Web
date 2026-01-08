import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmail, sendUpgradeSuccessEmail } from '@/lib/email'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      event,
      payload: {
        payment: {
          entity: {
            id: razorpay_payment_id,
            order_id: razorpay_order_id,
            status,
            amount,
          },
        },
      },
    } = body

    // Only process payment.captured event
    if (event !== 'payment.captured') {
      return NextResponse.json({ received: true })
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { orderId: razorpay_order_id },
      include: { 
        tenant: {
          include: {
            user: true
          }
        }
      },
    })

    if (!payment) {
      console.error('[Webhook] Payment not found:', razorpay_order_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // CRITICAL: Verify payment status directly from Razorpay API
    // This ensures we have the actual status, not just what's in our DB
    let razorpayPaymentStatus = status
    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id)
      razorpayPaymentStatus = razorpayPayment.status
      console.log(`[Webhook] Razorpay payment status: ${razorpayPaymentStatus}, Amount: ${razorpayPayment.amount / 100}`)
    } catch (err) {
      console.error('[Webhook] Failed to fetch payment from Razorpay:', err)
      // Continue with status from webhook payload
    }

    // Fetch order from Razorpay to get planId from notes
    let planId: string | null = null
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id)
      planId = order.notes?.planId as string | null
      console.log(`[Webhook] Fetched planId from Razorpay order: ${planId}`)
    } catch (err) {
      console.error('Failed to fetch Razorpay order:', err)
    }
    
    // If planId not in notes, try to get from payment record
    if (!planId && payment.subscriptionId) {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        include: { plan: true }
      })
      if (existingSubscription) {
        // Try to find plan by matching amount
        const matchingPlan = await prisma.subscriptionPlan.findFirst({
          where: {
            price: payment.amount,
            isActive: true
          }
        })
        if (matchingPlan) {
          planId = matchingPlan.id
          console.log(`[Webhook] Found planId by matching amount: ${planId}`)
        }
      }
    }

    // Verify signature
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      signature,
      webhookSecret
    )

    if (!isValid) {
      console.error('Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Determine final payment status
    const isSuccess = razorpayPaymentStatus === 'captured' || razorpayPaymentStatus === 'authorized'
    const finalStatus = isSuccess ? 'SUCCESS' : (razorpayPaymentStatus === 'failed' ? 'FAILED' : 'PENDING')
    
    console.log(`[Webhook] Processing payment: Order=${razorpay_order_id}, Payment=${razorpay_payment_id}, Status=${finalStatus}`)

    // Update payment status
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: finalStatus,
          paymentId: razorpay_payment_id,
          razorpaySignature: signature,
          // If payment failed/pending but money was deducted, mark for refund
          refundRequested: !isSuccess && payment.status === 'PENDING' ? true : undefined,
        },
      })

      // If payment successful, update tenant plan and subscription
      if (isSuccess) {
        // Get plan by planId from order notes, or fallback to price matching
        let plan = null
        if (planId) {
          plan = await tx.subscriptionPlan.findUnique({
            where: { id: planId },
          })
        }
        
        if (!plan) {
          // Fallback to price matching
          plan = await tx.subscriptionPlan.findFirst({
            where: { price: amount / 100 }, // Convert from paise
          })
        }

        if (plan) {
          const updatedTenant = await tx.tenant.update({
            where: { id: payment.tenantId },
            data: {
              plan: plan.name.toLowerCase(),
              paid: true,
              planActivatedAt: new Date(),
            },
            include: {
              user: true,
            },
          })

          // Get or create Admin record for subscription
          let admin = await tx.admin.findFirst({
            where: { tenantId: payment.tenantId },
          })

          if (!admin) {
            admin = await tx.admin.create({
              data: {
                businessName: updatedTenant.name,
                email: updatedTenant.user.email,
                password: '',
                tenantId: payment.tenantId,
              },
            })
          }

          // Get or create subscription - include plan to check if upgrade
          let subscription = await tx.subscription.findUnique({
            where: { adminId: admin.id },
            include: {
              plan: true, // Include plan to check if it's an upgrade
            },
          })

          const isUpgrade = subscription && subscription.planId !== plan.id
          const autoRenew = subscription?.autoRenew ?? true

          if (subscription) {
            // Update existing subscription - include plan in the update
            subscription = await tx.subscription.update({
              where: { id: subscription.id },
              data: {
                planId: plan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                paymentMethod: 'RAZORPAY',
                paymentId: razorpay_payment_id,
                autoRenew: autoRenew,
                downgradeDate: null, // Clear any downgrade date
              },
              include: {
                plan: true, // Include plan data in response
              },
            })
          } else {
            // Create new subscription
            subscription = await tx.subscription.create({
              data: {
                adminId: admin.id,
                planId: plan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                paymentMethod: 'RAZORPAY',
                paymentId: razorpay_payment_id,
                autoRenew: true,
              },
              include: {
                plan: true, // Include plan data in response
              },
            })
          }
          
          console.log(`[Webhook] Subscription updated: Admin ${admin.id}, Plan: ${plan.name} (${plan.displayName}), PlanId: ${plan.id}, IsUpgrade: ${isUpgrade}`)
          
          // CRITICAL: Verify the update was successful by re-fetching
          const verifySubscription = await tx.subscription.findUnique({
            where: { id: subscription.id },
            include: { plan: true }
          })
          
          if (!verifySubscription) {
            console.error(`[Webhook] ERROR: Subscription not found after update!`)
            throw new Error('Subscription not found after update')
          }
          
          if (verifySubscription.planId !== plan.id) {
            console.error(`[Webhook] ERROR: Subscription plan mismatch! Expected ${plan.id} (${plan.name}), got ${verifySubscription.planId} (${verifySubscription.plan.name})`)
            // Try to fix it
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { planId: plan.id }
            })
            console.log(`[Webhook] Attempted to fix plan mismatch`)
          } else {
            console.log(`[Webhook] Verified: Subscription plan correctly set to ${plan.name} (${plan.displayName}), PlanId: ${verifySubscription.planId}`)
          }
          
          // Update payment with subscriptionId
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              subscriptionId: subscription.id,
            },
          })

          // Send upgrade success email
          try {
            if (isUpgrade) {
              await sendUpgradeSuccessEmail(
                updatedTenant.user.email,
                updatedTenant.name,
                plan.displayName,
                amount / 100,
                payment.currency,
                razorpay_payment_id,
                razorpay_order_id,
                autoRenew
              )
            } else {
              await sendInvoiceEmail(
                updatedTenant.user.email,
                updatedTenant.name,
                plan.displayName,
                amount / 100,
                payment.currency,
                razorpay_payment_id,
                razorpay_order_id
              )
            }
          } catch (emailError) {
            console.error('Failed to send email:', emailError)
            // Don't fail webhook if email fails
          }
        }
      }
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

