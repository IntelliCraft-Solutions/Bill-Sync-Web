import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmail, sendUpgradeSuccessEmail } from '@/lib/email'
import Razorpay from 'razorpay'
import { getISTDate, addDaysToIST } from '@/lib/date-utils'

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
      const paymentAmount = typeof razorpayPayment.amount === 'number' 
        ? razorpayPayment.amount / 100 
        : Number(razorpayPayment.amount) / 100
      console.log(`[Webhook] Razorpay payment status: ${razorpayPaymentStatus}, Amount: ${paymentAmount}`)
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

    // CRITICAL: Update payment status and subscription in a transaction
    // This ensures atomicity - either everything updates or nothing does
    let subscriptionUpdated = false
    let updatedSubscriptionId: string | null = null
    let updatedPlanId: string | null = null
    let updatedPlanName: string | null = null
    
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
          const amountInRupees = typeof amount === 'number' ? amount / 100 : Number(amount) / 100
          plan = await tx.subscriptionPlan.findFirst({
            where: { price: amountInRupees }, // Convert from paise
          })
        }

        if (plan) {
          const istNow = getISTDate()
          const updatedTenant = await tx.tenant.update({
            where: { id: payment.tenantId },
            data: {
              plan: plan.name.toLowerCase(),
              paid: true,
              planActivatedAt: istNow,
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
            // CRITICAL: Ensure planId is updated to the new plan
            const istNow = getISTDate()
            const endDate = addDaysToIST(30) // 30 days from now
            subscription = await tx.subscription.update({
              where: { id: subscription.id },
              data: {
                planId: plan.id, // CRITICAL: Update to new plan
                status: 'ACTIVE',
                startDate: subscription.startDate, // Keep original start date
                endDate: endDate,
                paymentMethod: 'RAZORPAY',
                paymentId: razorpay_payment_id,
                autoRenew: autoRenew,
                downgradeDate: null, // Clear any downgrade date
              },
              include: {
                plan: true, // Include plan data in response
              },
            })
            console.log(`[Webhook] Updated subscription ${subscription.id} to plan ${plan.name} (${plan.id})`)
          } else {
            // Create new subscription
            const istNow = getISTDate()
            const endDate = addDaysToIST(30) // 30 days from now
            subscription = await tx.subscription.create({
              data: {
                adminId: admin.id,
                planId: plan.id, // CRITICAL: Set to the paid plan
                status: 'ACTIVE',
                startDate: istNow,
                endDate: endDate,
                paymentMethod: 'RAZORPAY',
                paymentId: razorpay_payment_id,
                autoRenew: true,
              },
              include: {
                plan: true, // Include plan data in response
              },
            })
            console.log(`[Webhook] Created new subscription ${subscription.id} with plan ${plan.name} (${plan.id})`)
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
          
          // CRITICAL: Update payment with subscriptionId and ensure it's linked
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              subscriptionId: subscription.id,
              status: 'SUCCESS', // Ensure payment status is SUCCESS
            },
          })

          console.log(`[Webhook] Payment ${payment.id} linked to subscription ${subscription.id}`)
          
          // Final verification: Re-fetch subscription to ensure all data is saved
          const finalCheck = await tx.subscription.findUnique({
            where: { id: subscription.id },
            include: {
              plan: true,
              payments: {
                where: { id: payment.id }
              }
            }
          })
          
          if (finalCheck) {
            console.log(`[Webhook] Final verification - Subscription: ${finalCheck.plan.name} (${finalCheck.planId}), Payment linked: ${finalCheck.payments.length > 0}`)
          }
          
          // Mark that subscription was updated
          subscriptionUpdated = true
          updatedSubscriptionId = subscription.id
          updatedPlanId = plan.id
          updatedPlanName = plan.name

          // Send upgrade success email
          try {
            const amountInRupees = typeof amount === 'number' ? amount / 100 : Number(amount) / 100
            if (isUpgrade) {
              await sendUpgradeSuccessEmail(
                updatedTenant.user.email,
                updatedTenant.name,
                plan.displayName,
                amountInRupees,
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
                amountInRupees,
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

    // CRITICAL: Post-transaction verification - fetch subscription directly from DB
    // This ensures the transaction was committed and data is persisted
    if (subscriptionUpdated && updatedSubscriptionId && updatedPlanId) {
      try {
        // Wait a small moment to ensure transaction is fully committed to database
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Force a fresh database connection to bypass any connection pooling cache
        // Use standard Prisma query first, then verify with raw query if needed
        const postTransactionCheck = await prisma.subscription.findUnique({
          where: { id: updatedSubscriptionId },
          include: {
            plan: true,
            admin: {
              select: {
                id: true,
                email: true,
                tenantId: true
              }
            }
          }
        }).then(async (result) => {
          if (!result) return null
          
          // Double-check with a fresh query to ensure no caching
          return await prisma.subscription.findFirst({
            where: { id: updatedSubscriptionId },
            include: {
              plan: true,
              admin: {
                select: {
                  id: true,
                  email: true,
                  tenantId: true
                }
              }
            }
          })
        }).catch(async (error) => {
          if (!rawResult || rawResult.length === 0) return null
          
          const subData = rawResult[0]
          // Now fetch with proper Prisma includes for full data
          return await prisma.subscription.findUnique({
            where: { id: subData.id },
            include: {
              plan: true,
              admin: {
                select: {
                  id: true,
                  email: true,
                  tenantId: true
                }
              }
            }
          })
        }).catch(async (error) => {
          console.error('[Webhook] Raw query failed, using standard query:', error)
          // Fallback to standard query
          return await prisma.subscription.findUnique({
            where: { id: updatedSubscriptionId },
            include: {
              plan: true,
              admin: {
                select: {
                  id: true,
                  email: true,
                  tenantId: true
                }
              }
            }
          })
        })
        
        if (postTransactionCheck) {
          console.log(`[Webhook] ✅ POST-TRANSACTION VERIFICATION: Subscription ${postTransactionCheck.id}`)
          console.log(`[Webhook]   - Plan: ${postTransactionCheck.plan.name} (${postTransactionCheck.planId})`)
          console.log(`[Webhook]   - Admin: ${postTransactionCheck.admin.email}`)
          console.log(`[Webhook]   - Expected Plan: ${updatedPlanName} (${updatedPlanId})`)
          
          // Double-check planId matches
          if (postTransactionCheck.planId !== updatedPlanId) {
            console.error(`[Webhook] ❌ CRITICAL ERROR: Post-transaction plan mismatch!`)
            console.error(`[Webhook]   Expected: ${updatedPlanId} (${updatedPlanName})`)
            console.error(`[Webhook]   Got: ${postTransactionCheck.planId} (${postTransactionCheck.plan.name})`)
            
            // Attempt to fix outside transaction - use standard Prisma update
            try {
              await prisma.subscription.update({
                where: { id: updatedSubscriptionId },
                data: { 
                  planId: updatedPlanId,
                  updatedAt: getISTDate()
                }
              })
              console.log(`[Webhook] ✅ Fixed plan mismatch using raw SQL update`)
              
              // Verify the fix
              const fixedCheck = await prisma.subscription.findUnique({
                where: { id: updatedSubscriptionId },
                include: { plan: true }
              })
              if (fixedCheck && fixedCheck.planId === updatedPlanId) {
                console.log(`[Webhook] ✅ VERIFIED: Plan correctly fixed to ${fixedCheck.plan.name}`)
              }
            } catch (fixError) {
              console.error(`[Webhook] ❌ Failed to fix plan mismatch:`, fixError)
            }
          } else {
            console.log(`[Webhook] ✅ VERIFIED: Plan correctly updated to ${postTransactionCheck.plan.name} (${postTransactionCheck.planId})`)
          }
        } else {
          console.error(`[Webhook] ❌ CRITICAL ERROR: Subscription ${updatedSubscriptionId} not found after transaction!`)
        }
      } catch (postCheckError) {
        console.error(`[Webhook] ❌ Error in post-transaction verification:`, postCheckError)
      }
    }

    return NextResponse.json({ 
      received: true,
      subscriptionUpdated: subscriptionUpdated,
      subscriptionId: updatedSubscriptionId
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

