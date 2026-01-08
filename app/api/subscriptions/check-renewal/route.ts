import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * This endpoint should be called by a cron job or scheduled task
 * to check for subscriptions that need to be renewed or downgraded
 */
export async function POST(req: NextRequest) {
  try {
    // Verify this is called from a cron job (add authentication in production)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      checked: 0,
      renewed: 0,
      downgraded: 0,
      errors: [] as string[]
    }

    // Get all active paid subscriptions that have ended
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        },
        plan: {
          price: {
            gt: 0 // Only paid plans
          }
        }
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    results.checked = expiredSubscriptions.length

    // Get FREE_TRIAL plan for downgrades
    const freeTrialPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE_TRIAL' }
    })

    if (!freeTrialPlan) {
      return NextResponse.json({ 
        error: 'Free Trial plan not found' 
      }, { status: 500 })
    }

    for (const subscription of expiredSubscriptions) {
      try {
        // Check if auto-renew is enabled and payment was successful
        const shouldRenew = subscription.autoRenew && 
                           subscription.payments.length > 0 &&
                           subscription.payments[0]?.status === 'SUCCESS'

        if (shouldRenew) {
          // Extend subscription for another month
          const newEndDate = new Date(now)
          newEndDate.setMonth(newEndDate.getMonth() + 1)

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              startDate: now,
              endDate: newEndDate,
              status: 'ACTIVE'
            }
          })

          results.renewed++
        } else {
          // Downgrade to FREE_TRIAL
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              planId: freeTrialPlan.id,
              status: 'ACTIVE',
              autoRenew: false,
              downgradeDate: now, // Start grace period
              endDate: now
            }
          })

          results.downgraded++

          // TODO: Send email notification about downgrade
        }
      } catch (error: any) {
        results.errors.push(`Subscription ${subscription.id}: ${error.message}`)
      }
    }

    // Check for grace period expirations (5 days after downgrade)
    const gracePeriodEnd = new Date(now)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 5)

    const expiredGracePeriods = await prisma.subscription.findMany({
      where: {
        downgradeDate: {
          lte: gracePeriodEnd
        },
        plan: {
          name: 'FREE_TRIAL'
        }
      },
      include: {
        admin: true,
        plan: true
      }
    })

    // Enforce product limits for expired grace periods
    for (const subscription of expiredGracePeriods) {
      try {
        const productCount = await prisma.product.count({
          where: { adminId: subscription.adminId }
        })

        const limit = (subscription.plan.limits as any)?.products || 10

        if (productCount > limit) {
          // Get products ordered by creation date (keep oldest)
          const products = await prisma.product.findMany({
            where: { adminId: subscription.adminId },
            orderBy: { createdAt: 'asc' },
            take: productCount // Get all to find which to delete
          })

          // Delete excess products (keep first 'limit' products)
          const productsToDelete = products.slice(limit)
          
          for (const product of productsToDelete) {
            await prisma.product.delete({
              where: { id: product.id }
            })
          }

          console.log(`Deleted ${productsToDelete.length} excess products for admin ${subscription.adminId}`)
        }

        // Clear downgrade date after enforcement
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            downgradeDate: null
          }
        })
      } catch (error: any) {
        results.errors.push(`Grace period enforcement ${subscription.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString()
    })
  } catch (error: any) {
    console.error('Renewal check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check renewals' },
      { status: 500 }
    )
  }
}

