import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant ID from session
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
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
    }

    // Get admin record
    const admin = await prisma.admin.findFirst({
      where: { tenantId: finalTenantId },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Get FREE_TRIAL plan for downgrade
    const freeTrialPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE_TRIAL' }
    })

    if (!freeTrialPlan) {
      return NextResponse.json(
        { error: 'Free Trial plan not found' },
        { status: 500 }
      )
    }

    // Cancel subscription: disable auto-renew but keep plan active until endDate
    // Don't downgrade immediately - let the renewal check handle it at end of period
    const subscription = await prisma.subscription.update({
      where: { adminId: admin.id },
      data: { 
        autoRenew: false,
        // Keep current plan active until endDate
        // Status remains ACTIVE until endDate passes
      },
      include: {
        plan: true
      }
    })

    return NextResponse.json({ 
      success: true,
      subscription 
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

