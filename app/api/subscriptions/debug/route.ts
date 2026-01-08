import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Debug endpoint to check actual database state
 */
export async function GET(req: NextRequest) {
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

    // Get subscription DIRECTLY from database - no includes, just raw data
    const subscriptionRaw = await prisma.subscription.findUnique({
      where: { adminId: admin.id },
    })

    // Get the plan separately
    let plan = null
    if (subscriptionRaw) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionRaw.planId },
      })
    }

    // Get all payments
    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: subscriptionRaw?.id,
        status: {
          in: ['SUCCESS', 'PENDING', 'FAILED']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get all plans for reference
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({
      adminId: admin.id,
      subscriptionRaw: {
        id: subscriptionRaw?.id,
        planId: subscriptionRaw?.planId,
        status: subscriptionRaw?.status,
        autoRenew: subscriptionRaw?.autoRenew,
        startDate: subscriptionRaw?.startDate,
        endDate: subscriptionRaw?.endDate,
      },
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        limits: plan.limits,
        features: plan.features,
      } : null,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        paymentId: p.paymentId,
        orderId: p.orderId,
      })),
      allPlans: allPlans.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        price: p.price,
      })),
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to debug' },
      { status: 500 }
    )
  }
}

