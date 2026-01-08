import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add cache control headers to prevent stale data
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

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

    // Get tenant with plan info
    const tenant = await prisma.tenant.findUnique({
      where: { id: finalTenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get or create Admin record
    let admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      admin = await prisma.admin.create({
        data: {
          businessName: tenant.name,
          email: tenant.email,
          password: '',
          tenantId: finalTenantId,
        },
      })
    }

    // CRITICAL: Get subscription - ALWAYS fetch fresh from DB with no caching
    // Force a fresh query by using findFirst (not findUnique) to bypass any query cache
    let subscription = await prisma.subscription.findFirst({
      where: { 
        adminId: admin.id
      },
      include: {
        plan: true, // Explicitly fetch plan to ensure we get latest data
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Get more payments for billing history
          where: {
            status: {
              in: ['SUCCESS', 'PENDING', 'FAILED'] // Only show relevant payment statuses
            }
          }
        }
      }
    })
    
    // Log for debugging
    if (subscription) {
      console.log(`[Subscription API] Admin ${admin.id}: Plan=${subscription.plan.name}, PlanId=${subscription.planId}, Price=${subscription.plan.price}, Status=${subscription.status}`)
    }

    // If subscription exists, return it with autoRenew
    // Also ensure plan name is correct (migrate old STANDARD with price 0 to FREE_TRIAL)
    if (subscription) {
      // Check if plan is old STANDARD (price 0) and needs migration
      if (subscription.plan.name === 'STANDARD' && subscription.plan.price === 0) {
        const freeTrialPlan = await prisma.subscriptionPlan.findFirst({
          where: { name: 'FREE_TRIAL' }
        });
        
        if (freeTrialPlan) {
          subscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: { planId: freeTrialPlan.id },
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
          });
          console.log(`[Subscription API] Migrated subscription from STANDARD (free) to FREE_TRIAL`)
        }
      }
      
      // CRITICAL: Re-fetch subscription by adminId to get absolute latest data
      // This ensures we get the plan that was just updated by webhook
      // Force a fresh database query by using findFirst with explicit conditions
      const finalSubscription = await prisma.subscription.findFirst({
        where: { 
          adminId: admin.id
        },
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
      
      if (!finalSubscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }
      
      console.log(`[Subscription API] Final subscription: Plan=${finalSubscription.plan.name}, PlanId=${finalSubscription.planId}, Price=${finalSubscription.plan.price}, Payments=${finalSubscription.payments.length}`)
      
      // Log payment details for debugging
      if (finalSubscription.payments.length > 0) {
        console.log(`[Subscription API] Payments:`, finalSubscription.payments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt
        })))
      } else {
        console.log(`[Subscription API] WARNING: No payments found for subscription`)
      }
      
      const response = NextResponse.json({
        ...finalSubscription,
        autoRenew: finalSubscription.autoRenew ?? true,
      })
      
      // Add cache control headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }

    // If no subscription, create one with free plan
    if (!subscription) {
      // Try FREE_TRIAL first, fallback to STANDARD for backward compatibility
      let freePlan = await prisma.subscriptionPlan.findFirst({
        where: { name: 'FREE_TRIAL' },
      })
      
      if (!freePlan) {
        freePlan = await prisma.subscriptionPlan.findFirst({
          where: { name: 'STANDARD', price: 0 },
        })
      }

      if (freePlan) {
        subscription = await prisma.subscription.create({
          data: {
            adminId: admin.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            startDate: new Date(),
          },
          include: {
            plan: true,
            payments: true,
          }
        })
      } else {
        // Return tenant-based subscription info
        return NextResponse.json({
          id: tenant.id,
          status: tenant.paid ? 'ACTIVE' : 'TRIAL',
          startDate: tenant.createdAt,
          endDate: tenant.planActivatedAt,
          plan: {
            name: tenant.plan.toUpperCase(),
            displayName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
            price: 0,
            features: [],
            limits: {},
          }
        })
      }
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
